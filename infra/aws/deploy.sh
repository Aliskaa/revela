#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Deploiement complet de Revela sur AWS (CFN + ECR + EC2 docker).
#
# Idempotent : peut etre relance pour les MAJ.
#  - Premier run : cree le stack CFN, attend les repos ECR, build/push les
#    images, pause sur la validation ACM (CNAME a poser sur o2switch),
#    demarre les conteneurs.
#  - Runs suivants : detecte le stack existant et fait juste build/push +
#    restart SSM.
#
# Usage :
#   ./deploy.sh                       # Menu interactif (TTY) ou tout deployer
#   ./deploy.sh --target all          # Backend + frontend (non interactif)
#   ./deploy.sh --target backend      # Backend uniquement
#   ./deploy.sh --target frontend     # Frontend uniquement
#   ./deploy.sh --backend-only        # Alias de --target backend
#   ./deploy.sh --frontend-only       # Alias de --target frontend
#   ./deploy.sh --migrate-db          # Migration DB puis restart (avant trafic)
#   ./deploy.sh --image-tag v1.0.1    # MAJ avec tag versionne
#   ./deploy.sh --skip-build          # Juste forcer un restart EC2 (cible via menu/--target)
#   ./deploy.sh --skip-build --migrate-db  # Migration seule (sans rebuild)
#
# Pre-requis : aws CLI v2, docker (avec buildx), jq, bash 4+
# -----------------------------------------------------------------------------

set -euo pipefail

# AWS CLI sous Windows (Git Bash) echoue sur la sortie Unicode de drizzle-kit migrate
# (spinner TTY) si PYTHONUTF8 n'est pas actif — le polling SSM reste alors bloque.
export PYTHONUTF8="${PYTHONUTF8:-1}"

# Repertoire du script + racine du repo (2 niveaux au-dessus)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ─── Defaults ────────────────────────────────────────────────────────
CONFIG_FILE="$SCRIPT_DIR/deploy.config.json"
IMAGE_TAG="latest"
SKIP_BUILD=false
MIGRATE_DB=false
DEPLOY_TARGET=""   # all | backend | frontend (vide = menu interactif si TTY)
DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false

# ─── Parsing arguments ───────────────────────────────────────────────
usage() {
    sed -n '2,/^# ---/p' "$0" | sed 's/^# \?//' | head -n -1
    exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --config)        CONFIG_FILE="$2"; shift 2 ;;
        --image-tag)     IMAGE_TAG="$2";   shift 2 ;;
        --skip-build)    SKIP_BUILD=true;  shift ;;
        --migrate-db)    MIGRATE_DB=true;  shift ;;
        --target)        DEPLOY_TARGET="$2"; shift 2 ;;
        --backend-only)  DEPLOY_TARGET="backend"; shift ;;
        --frontend-only) DEPLOY_TARGET="frontend"; shift ;;
        -h|--help)       usage 0 ;;
        *) echo "Argument inconnu : $1" >&2; usage 1 ;;
    esac
done

# ─── Helpers d'affichage ─────────────────────────────────────────────
if [[ -t 1 ]]; then
    C_CYAN="\033[0;36m"; C_GREEN="\033[0;32m"; C_YELLOW="\033[1;33m"
    C_RED="\033[0;31m"; C_GRAY="\033[0;90m"; C_RESET="\033[0m"
else
    C_CYAN=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_GRAY=""; C_RESET=""
fi

step() { printf "\n${C_CYAN}>>> %s${C_RESET}\n" "$*"; }
ok()   { printf "    ${C_GREEN}OK : %s${C_RESET}\n" "$*"; }
warn() { printf "    ${C_YELLOW}WARN : %s${C_RESET}\n" "$*"; }
err()  { printf "    ${C_RED}ERR : %s${C_RESET}\n" "$*" >&2; }
gray() { printf "    ${C_GRAY}%s${C_RESET}\n" "$*"; }

# ─── Cible de deploiement ────────────────────────────────────────────
resolve_deploy_targets() {
    case "$DEPLOY_TARGET" in
        all)
            DEPLOY_BACKEND=true
            DEPLOY_FRONTEND=true
            ;;
        backend)
            DEPLOY_BACKEND=true
            ;;
        frontend)
            DEPLOY_FRONTEND=true
            ;;
        *)
            err "Cible invalide : '$DEPLOY_TARGET' (attendu : all, backend, frontend)"
            exit 1
            ;;
    esac
}

prompt_deploy_target() {
    if [[ -n "$DEPLOY_TARGET" ]]; then
        resolve_deploy_targets
        return
    fi

    if [[ ! -t 0 ]]; then
        DEPLOY_TARGET="all"
        resolve_deploy_targets
        gray "Mode non interactif : deploiement complet (backend + frontend)"
        return
    fi

    echo
    printf "${C_CYAN}===================================================================${C_RESET}\n"
    printf "${C_CYAN}  Deploiement Revela — %s (tag=%s)${C_RESET}\n" "$STACK_NAME" "$IMAGE_TAG"
    printf "${C_CYAN}===================================================================${C_RESET}\n"
    $SKIP_BUILD && gray "Build/push : ignore (--skip-build)"
    $MIGRATE_DB && gray "Migration DB : oui (--migrate-db)"
    echo
    echo "  Que souhaitez-vous deployer ?"
    echo
    echo "    1) Tout (backend + frontend)"
    echo "    2) Backend uniquement"
    echo "    3) Frontend uniquement"
    echo "    4) Quitter"
    echo
    local choice=""
    while true; do
        read -r -p "  Choix [1-4] : " choice
        case "$choice" in
            1) DEPLOY_TARGET="all"; break ;;
            2) DEPLOY_TARGET="backend"; break ;;
            3) DEPLOY_TARGET="frontend"; break ;;
            4) echo "Annule."; exit 0 ;;
            *) echo "  Choix invalide, saisissez 1, 2, 3 ou 4." ;;
        esac
    done
    echo
    resolve_deploy_targets
}

deploy_target_label() {
    if $DEPLOY_BACKEND && $DEPLOY_FRONTEND; then
        echo "backend + frontend"
    elif $DEPLOY_BACKEND; then
        echo "backend"
    else
        echo "frontend"
    fi
}

# ─── Pre-flight : config + outils ───────────────────────────────────
step "Lecture de la config"
if [[ ! -f "$CONFIG_FILE" ]]; then
    err "Config introuvable : $CONFIG_FILE"
    echo "Copie deploy.config.example.json en deploy.config.json et remplis-la."
    exit 1
fi

# Validation des champs obligatoires
required_keys=(Region StackName VpcId PublicSubnetIdEc2 PrivateSubnetIdsRds AlbSecurityGroupId AlbHttpsListenerArn DomainName)
for key in "${required_keys[@]}"; do
    if [[ "$(jq -r --arg k "$key" '.[$k] // empty' "$CONFIG_FILE")" == "" ]]; then
        err "Champ manquant dans la config : $key"; exit 1
    fi
done

REGION="$(jq -r .Region "$CONFIG_FILE")"
STACK_NAME="$(jq -r .StackName "$CONFIG_FILE")"
DOMAIN_NAME="$(jq -r .DomainName "$CONFIG_FILE")"
ok "Config OK (stack=$STACK_NAME, region=$REGION, domain=$DOMAIN_NAME)"

step "Verification des outils"
for tool in aws docker jq; do
    command -v "$tool" >/dev/null 2>&1 || { err "$tool introuvable dans le PATH"; exit 1; }
done
docker buildx version >/dev/null 2>&1 || { err "docker buildx non disponible"; exit 1; }
ok "aws / docker / docker buildx / jq presents"

step "Verification identite AWS"
if ! identity_json="$(aws sts get-caller-identity --output json 2>/dev/null)"; then
    err "AWS auth KO — verifie tes credentials"
    exit 1
fi
ACCOUNT_ID="$(echo "$identity_json" | jq -r .Account)"
ARN="$(echo "$identity_json" | jq -r .Arn)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ok "Compte $ACCOUNT_ID ($ARN)"

prompt_deploy_target
ok "Cible : $(deploy_target_label)"

# ─── Stack : creation ou detection ──────────────────────────────────
step "Detection du stack '$STACK_NAME'"
STACK_EXISTS=false
if stack_json="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --output json 2>/dev/null)"; then
    STACK_EXISTS=true
    status="$(echo "$stack_json" | jq -r '.Stacks[0].StackStatus')"
    ok "Stack present (statut $status)"
    case "$status" in
        *ROLLBACK*|*FAILED*)
            err "Stack en mauvais etat : $status. Examine via :"
            echo "  aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $REGION"
            exit 1 ;;
        *_IN_PROGRESS)
            step "Operation en cours, attente..."
            aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION" 2>/dev/null \
                || aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME" --region "$REGION" 2>/dev/null \
                || true
            ;;
    esac
else
    step "Creation du stack '$STACK_NAME'"
    template_file="$SCRIPT_DIR/cloudformation.yaml"
    [[ -f "$template_file" ]] || { err "Template introuvable : $template_file"; exit 1; }

    # Liste de subnets RDS : virgules echappees pour la syntaxe shorthand AWS CLI
    rds_subnets="$(jq -r '.PrivateSubnetIdsRds | join("\\,")' "$CONFIG_FILE")"
    vpc_id="$(jq -r .VpcId "$CONFIG_FILE")"
    pub_subnet="$(jq -r .PublicSubnetIdEc2 "$CONFIG_FILE")"
    alb_sg="$(jq -r .AlbSecurityGroupId "$CONFIG_FILE")"
    alb_listener="$(jq -r .AlbHttpsListenerArn "$CONFIG_FILE")"

    params=(
        "ParameterKey=VpcId,ParameterValue=$vpc_id"
        "ParameterKey=PublicSubnetIdEc2,ParameterValue=$pub_subnet"
        "ParameterKey=PrivateSubnetIdsRds,ParameterValue=$rds_subnets"
        "ParameterKey=AlbSecurityGroupId,ParameterValue=$alb_sg"
        "ParameterKey=AlbHttpsListenerArn,ParameterValue=$alb_listener"
        "ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
        "ParameterKey=ImageTag,ParameterValue=$IMAGE_TAG"
    )
    priority="$(jq -r '.AlbListenerRulePriority // empty' "$CONFIG_FILE")"
    [[ -n "$priority" ]] && params+=("ParameterKey=AlbListenerRulePriority,ParameterValue=$priority")
    admin_user="$(jq -r '.AdminUsername // empty' "$CONFIG_FILE")"
    [[ -n "$admin_user" ]] && params+=("ParameterKey=AdminUsername,ParameterValue=$admin_user")

    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" --region "$REGION" \
        --template-body "$(cat "$template_file")" \
        --capabilities CAPABILITY_IAM \
        --parameters "${params[@]}" >/dev/null
    ok "create-stack lance (async)"
fi

# ─── Attente des repos ECR ──────────────────────────────────────────
ecr_repos=()
$DEPLOY_BACKEND && ecr_repos+=(revela/backend)
$DEPLOY_FRONTEND && ecr_repos+=(revela/frontend)
step "Attente des repos ECR (${ecr_repos[*]})"
deadline=$(( $(date +%s) + 300 ))
while true; do
    if aws ecr describe-repositories --region "$REGION" \
            --repository-names "${ecr_repos[@]}" --output json >/dev/null 2>&1; then
        break
    fi
    if (( $(date +%s) > deadline )); then err "Timeout attente repos ECR"; exit 1; fi
    sleep 10
    gray "(encore en cours de creation...)"
done
ok "Repos ECR disponibles"

# ─── Build + push ───────────────────────────────────────────────────
if $SKIP_BUILD; then
    warn "Build/push sautes (--skip-build)"
else
    step "Login ECR"
    aws ecr get-login-password --region "$REGION" \
        | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null
    ok "Login OK"

    pushd "$REPO_ROOT" >/dev/null
    trap 'popd >/dev/null' EXIT

    if $DEPLOY_BACKEND; then
        step "Build + push backend (linux/arm64, tag=$IMAGE_TAG)"
        backend_tags=(-t "$REGISTRY/revela/backend:$IMAGE_TAG")
        [[ "$IMAGE_TAG" != "latest" ]] && backend_tags+=(-t "$REGISTRY/revela/backend:latest")
        docker buildx build \
            --platform linux/arm64 \
            -f applications/backend/Dockerfile \
            "${backend_tags[@]}" \
            --push .
        ok "Backend pushe"
    fi

    if $DEPLOY_FRONTEND; then
        step "Build + push frontend (linux/arm64, tag=$IMAGE_TAG)"
        frontend_tags=(-t "$REGISTRY/revela/frontend:$IMAGE_TAG")
        [[ "$IMAGE_TAG" != "latest" ]] && frontend_tags+=(-t "$REGISTRY/revela/frontend:latest")
        docker buildx build \
            --platform linux/arm64 \
            -f applications/frontend/Dockerfile \
            "${frontend_tags[@]}" \
            --push .
        ok "Frontend pushe"
    fi

    popd >/dev/null
    trap - EXIT
fi

# ─── 1er deploiement : pause ACM + attente CREATE_COMPLETE ──────────
if ! $STACK_EXISTS; then
    step "Recuperation du CNAME de validation ACM"
    cert_arn=""
    deadline=$(( $(date +%s) + 180 ))
    while true; do
        if cert_resources="$(aws cloudformation describe-stack-resources \
                --stack-name "$STACK_NAME" --region "$REGION" \
                --logical-resource-id Certificate --output json 2>/dev/null)"; then
            cert_arn="$(echo "$cert_resources" | jq -r '.StackResources[0].PhysicalResourceId // empty')"
            [[ -n "$cert_arn" ]] && break
        fi
        if (( $(date +%s) > deadline )); then break; fi
        sleep 10
    done

    if [[ -z "$cert_arn" ]]; then
        warn "Cert pas encore visible — recupere le CNAME manuellement dans la console ACM"
    else
        # Le record de validation peut prendre quelques secondes a apparaitre
        deadline=$(( $(date +%s) + 120 ))
        rr_name=""; rr_value=""; rr_type=""
        while true; do
            cert_desc="$(aws acm describe-certificate --certificate-arn "$cert_arn" --region "$REGION" --output json 2>/dev/null || echo '{}')"
            rr_name="$(echo "$cert_desc"  | jq -r '.Certificate.DomainValidationOptions[0].ResourceRecord.Name  // empty')"
            rr_value="$(echo "$cert_desc" | jq -r '.Certificate.DomainValidationOptions[0].ResourceRecord.Value // empty')"
            rr_type="$(echo "$cert_desc"  | jq -r '.Certificate.DomainValidationOptions[0].ResourceRecord.Type  // empty')"
            [[ -n "$rr_name" ]] && break
            if (( $(date +%s) > deadline )); then break; fi
            sleep 5
        done

        if [[ -n "$rr_name" ]]; then
            echo
            printf "${C_YELLOW}===================================================================${C_RESET}\n"
            printf "${C_YELLOW}  ACTION REQUISE — Pose ce CNAME sur o2switch (zone cabinet-aor.fr)${C_RESET}\n"
            printf "${C_YELLOW}===================================================================${C_RESET}\n"
            echo  "  Type   : $rr_type"
            echo  "  Name   : $rr_name"
            echo  "  Value  : $rr_value"
            echo
            read -r -p "Appuie sur Entree une fois le CNAME en place (propagation DNS 5-30 min)... " _
        else
            warn "Validation record pas encore expose — verifie la console ACM"
        fi
    fi

    step "Attente CREATE_COMPLETE (5-15 min, RDS est lent)"
    if ! aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME" --region "$REGION"; then
        err "Stack en echec ou timeout. Diagnostique :"
        echo "  aws cloudformation describe-stack-events --stack-name $STACK_NAME --region $REGION --max-items 30"
        exit 1
    fi
    ok "Stack CREATE_COMPLETE"
fi

# ─── Recup outputs du stack ─────────────────────────────────────────
outputs="$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --output json | jq -c '.Stacks[0].Outputs')"
get_output() { echo "$outputs" | jq -r --arg k "$1" '.[] | select(.OutputKey==$k) | .OutputValue'; }

EC2_INSTANCE_ID="$(get_output Ec2InstanceId)"
ADMIN_PASSWORD_SEC_ARN="$(get_output AdminPasswordSecretArn)"
RDS_ENDPOINT="$(get_output RdsEndpoint)"

[[ -n "$EC2_INSTANCE_ID" ]] || { err "Output Ec2InstanceId introuvable"; exit 1; }

# ─── Helper SSM RunCommand ──────────────────────────────────────────
ssm_run() {
    local description="$1"; shift
    local timeout_min="${1:-5}"; shift
    # Le reste des args = commandes shell a executer

    # Construit le JSON {"commands": [...]} via jq
    local cmds_json
    cmds_json="$(printf '%s\n' "$@" | jq -R . | jq -sc '{commands: .}')"

    local cmd_id
    if ! cmd_id="$(aws ssm send-command \
            --instance-ids "$EC2_INSTANCE_ID" --region "$REGION" \
            --document-name AWS-RunShellScript \
            --parameters "$cmds_json" \
            --output json | jq -r '.Command.CommandId')"; then
        err "send-command KO ($description)"
        return 1
    fi
    gray "SSM cmd $cmd_id"

    local deadline=$(( $(date +%s) + timeout_min * 60 ))
    local inv_status="" inv_stdout="" inv_stderr=""
    while true; do
        sleep 5
        # --query Status evite de parser du JSON contenant des caracteres Unicode (spinner drizzle-kit).
        if inv_status="$(aws ssm get-command-invocation \
                --command-id "$cmd_id" --instance-id "$EC2_INSTANCE_ID" --region "$REGION" \
                --query Status --output text 2>/dev/null)"; then
            case "$inv_status" in
                Success|Failed|Cancelled|TimedOut) break ;;
            esac
        fi
        if (( $(date +%s) > deadline )); then err "Timeout SSM ($description)"; return 1; fi
    done

    inv_stdout="$(aws ssm get-command-invocation \
            --command-id "$cmd_id" --instance-id "$EC2_INSTANCE_ID" --region "$REGION" \
            --query 'StandardOutputContent' --output text 2>/dev/null || true)"
    inv_stderr="$(aws ssm get-command-invocation \
            --command-id "$cmd_id" --instance-id "$EC2_INSTANCE_ID" --region "$REGION" \
            --query 'StandardErrorContent' --output text 2>/dev/null || true)"

    if [[ "$inv_status" == "Success" ]]; then
        ok "$description"
        if [[ -n "${inv_stdout//[[:space:]]/}" ]]; then
            while IFS= read -r line; do gray "| $line"; done <<< "$inv_stdout"
        fi
        return 0
    else
        err "$description : statut $inv_status"
        [[ -n "$inv_stdout" ]] && printf "${C_RED}%s${C_RESET}\n" "$inv_stdout" >&2
        [[ -n "$inv_stderr" ]] && printf "${C_RED}%s${C_RESET}\n" "$inv_stderr" >&2
        return 1
    fi
}

# ─── Pull + up sur l'EC2 ────────────────────────────────────────────
# Le login ECR du bootstrap expire (~12h). Sans re-login, pull/up echouent
# mais SSM reste Success si la derniere commande (ps) passe — d'ou set -e.
compose_services=()
$DEPLOY_BACKEND && compose_services+=(backend)
$DEPLOY_FRONTEND && compose_services+=(frontend)
compose_services_str="${compose_services[*]}"

# Pull backend aussi si migration demandee (meme deploy frontend-only).
pull_services=("${compose_services[@]}")
if $MIGRATE_DB; then
    if [[ " ${pull_services[*]} " != *" backend "* ]]; then
        pull_services+=(backend)
    fi
fi
pull_services_str="${pull_services[*]}"

container_checks=()
$DEPLOY_BACKEND && container_checks+=('revela-backend-1')
$DEPLOY_FRONTEND && container_checks+=('revela-frontend-1')
container_check_cmd='for c in '"${container_checks[*]}"'; do age=$(( $(date +%s) - $(date -d "$(sudo docker inspect -f "{{.State.StartedAt}}" "$c")" +%s) )); if (( age > 600 )); then echo "Container $c pas redemarre (age ${age}s)"; exit 1; fi; done'

# Sur l'EC2 (8 Go), ne garder que le tag deploye + le precedent par repo Revela.
ec2_prune_revela_repo_fn='prune_revela_repo(){ local repo="$1" prev="$2" cur="'"${IMAGE_TAG}"'" reg="'"${REGISTRY}"'"; local keep="$cur"; [[ -n "$prev" && "$prev" != "$cur" ]] && keep="$keep $prev"; while IFS= read -r img; do [[ -z "$img" || "$img" == *"<none>"* ]] && continue; tag="${img##*:}"; ok=0; for t in $keep; do [[ "$tag" == "$t" ]] && ok=1; done; [[ "$ok" == 1 ]] || sudo docker rmi "$img" 2>/dev/null || true; done < <(sudo docker images "${reg}/revela/${repo}" --format "{{.Repository}}:{{.Tag}}"); }'

ssm_restart_cmds=(
    'set -euo pipefail'
    'cd /opt/revela'
    'PREV_BACKEND_TAG=$(grep -oE "revela/backend:[a-zA-Z0-9._-]+" docker-compose.yml | head -1 | sed "s|.*revela/backend:||")'
    'PREV_FRONTEND_TAG=$(grep -oE "revela/frontend:[a-zA-Z0-9._-]+" docker-compose.yml | head -1 | sed "s|.*revela/frontend:||")'
)
# Ne reecrire le tag QUE pour les services reellement deployes : sinon un
# deploy frontend-only repointe le backend vers un tag inexistant (et inversement).
$DEPLOY_BACKEND && ssm_restart_cmds+=(
    "sudo sed -i 's|revela/backend:[a-zA-Z0-9._-]*|revela/backend:${IMAGE_TAG}|g' /opt/revela/docker-compose.yml"
)
$DEPLOY_FRONTEND && ssm_restart_cmds+=(
    "sudo sed -i 's|revela/frontend:[a-zA-Z0-9._-]*|revela/frontend:${IMAGE_TAG}|g' /opt/revela/docker-compose.yml"
)
ssm_restart_cmds+=(
    "aws ecr get-login-password --region ${REGION} | sudo docker login --username AWS --password-stdin ${REGISTRY}"
    "sudo docker compose pull ${pull_services_str}"
)
if $MIGRATE_DB; then
    ssm_restart_cmds+=(
        'echo ">>> Migration DB (conteneur ephemere, avant restart backend)"'
        'sudo docker compose run --rm --no-deps backend sh -c "cd /workspace && CI=1 pnpm --filter @aor/drizzle db:migrate"'
    )
fi
ssm_restart_cmds+=(
    "sudo docker compose up -d --force-recreate --no-deps --remove-orphans ${compose_services_str}"
    "$container_check_cmd"
    "$ec2_prune_revela_repo_fn"
)
$DEPLOY_BACKEND && ssm_restart_cmds+=('prune_revela_repo backend "$PREV_BACKEND_TAG"')
$DEPLOY_FRONTEND && ssm_restart_cmds+=('prune_revela_repo frontend "$PREV_FRONTEND_TAG"')
ssm_restart_cmds+=(
    'sudo docker image prune -f >/dev/null'
    'echo "Images Revela restantes:"; sudo docker images --format "{{.Repository}}:{{.Tag}}" | grep revela/ || true'
    'echo "Disque:"; df -h / | tail -1'
    'sudo docker compose ps --format "{{.Service}}: {{.Status}} (image {{.Image}})"'
)

if $MIGRATE_DB; then
    step "SSM : pull + migration DB + up -d --force-recreate ($compose_services_str)"
else
    step "SSM : ECR login + pull + up -d --force-recreate ($compose_services_str)"
fi
ssm_run "Deploy conteneurs ($compose_services_str)" 10 "${ssm_restart_cmds[@]}"

# ─── Resume final ───────────────────────────────────────────────────
echo
printf "${C_GREEN}===================================================================${C_RESET}\n"
printf "${C_GREEN}  DEPLOIEMENT TERMINE ($(deploy_target_label))${C_RESET}\n"
printf "${C_GREEN}===================================================================${C_RESET}\n"
echo
echo "URL applicative  : https://$DOMAIN_NAME"
echo "EC2 instance     : $EC2_INSTANCE_ID"
echo "RDS endpoint     : $RDS_ENDPOINT"
echo
echo "Etapes restantes a faire manuellement :"
echo
echo "  1. CNAME final sur o2switch (si pas deja fait) :"
echo "     revela.cabinet-aor.fr  CNAME  <DNS de ton ALB existant>"
echo "     (Console EC2 > Load Balancers > marketdash > DNS name)"
echo
echo "  2. Recuperer le mot de passe super-admin :"
echo "     aws secretsmanager get-secret-value --secret-id $ADMIN_PASSWORD_SEC_ARN --region $REGION --query SecretString --output text | jq -r .password"
echo
if ! $MIGRATE_DB; then
    echo "  3. Si le schema DB a change, relance avec migration avant restart :"
    echo "     ./deploy.sh --skip-build --migrate-db --image-tag ${IMAGE_TAG}"
    echo
fi
