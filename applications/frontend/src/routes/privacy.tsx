// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/privacy')({
    component: PrivacyPolicyPage,
});

/**
 * Politique de confidentialité publique. Page accessible sans authentification depuis :
 *  - le footer participant (`FooterLayout`)
 *  - la mention RGPD pré-questionnaire (`/invite/$token`)
 *  - les écrans de connexion (admin et participant)
 *
 * Le contenu ci-dessous est un **template à valider par le client** (DPO / juriste). Les
 * placeholders {{...}} doivent être remplacés par les informations réelles de la structure
 * éditrice (raison sociale, SIRET, DPO, sous-traitants, durée de conservation effective,
 * coordonnées CNIL, etc.) avant publication. Voir docs/avancement-2026-05-01.md §3 (G3).
 */
function PrivacyPolicyPage() {
    return (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
            <Stack spacing={4}>
                <Box>
                    <MuiLink
                        component={Link}
                        to="/"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 2,
                            color: 'text.secondary',
                            textDecoration: 'none',
                            '&:hover': { color: 'primary.main' },
                        }}
                    >
                        <ArrowLeft size={16} />
                        <Typography variant="body2" fontWeight={600}>
                            Retour
                        </Typography>
                    </MuiLink>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <ShieldCheck size={28} color="rgb(15,24,152)" />
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                            Politique de confidentialité
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Dernière mise à jour : <em>{'{{DATE_DERNIERE_MAJ}}'}</em>
                    </Typography>
                </Box>

                <Divider />

                <Section title="1. Identité du responsable de traitement">
                    <Paragraph>
                        Le présent service Révéla est édité par <strong>{'{{RAISON_SOCIALE}}'}</strong>, société
                        immatriculée au RCS sous le numéro <strong>{'{{SIRET}}'}</strong>, dont le siège social est
                        situé <strong>{'{{ADRESSE_SIEGE}}'}</strong>.
                    </Paragraph>
                    <Paragraph>
                        Délégué à la protection des données (DPO) : <strong>{'{{NOM_DPO}}'}</strong> —{' '}
                        <MuiLink href="mailto:{{EMAIL_DPO}}">{'{{EMAIL_DPO}}'}</MuiLink>.
                    </Paragraph>
                </Section>

                <Section title="2. Finalités du traitement">
                    <Paragraph>
                        Les données collectées via la plateforme Révéla sont traitées exclusivement aux fins suivantes :
                    </Paragraph>
                    <ul>
                        <li>
                            Permettre la passation des questionnaires d'évaluation comportementale (auto-évaluation,
                            feedback de pairs, élément humain) dans le cadre d'une mission de coaching ou de bilan
                            mandatée par votre employeur.
                        </li>
                        <li>
                            Calculer et restituer vos résultats individuels (profil comportemental, scores
                            psychométriques) à vous-même et au coach mandaté par votre employeur.
                        </li>
                        <li>
                            Permettre à votre coach et à l'administrateur de la plateforme de piloter la campagne
                            d'évaluation (suivi des participants, état des invitations, statut de complétion).
                        </li>
                        <li>
                            Assurer la sécurité technique du service (authentification, journalisation des erreurs,
                            prévention des accès illégitimes).
                        </li>
                    </ul>
                </Section>

                <Section title="3. Base légale">
                    <Paragraph>
                        Le traitement repose sur l'<strong>exécution d'un contrat</strong> auquel vous êtes partie ou
                        sur l'exécution de mesures précontractuelles prises à votre demande (article 6.1.b du RGPD), à
                        savoir la prestation de coaching ou de bilan commandée par votre employeur.
                    </Paragraph>
                    <Paragraph>
                        Pour les traitements complémentaires (comme l'envoi d'invitations par e-mail), nous nous
                        appuyons sur l'<strong>intérêt légitime</strong> de l'employeur et de la structure éditrice à
                        organiser et délivrer la prestation (article 6.1.f du RGPD).
                    </Paragraph>
                </Section>

                <Section title="4. Données collectées">
                    <Paragraph>Dans le cadre de votre participation, sont collectées :</Paragraph>
                    <ul>
                        <li>
                            <strong>Données d'identification</strong> : nom, prénom, adresse e-mail professionnelle.
                        </li>
                        <li>
                            <strong>Données professionnelles</strong> : nom de l'entreprise, direction, service, niveau
                            hiérarchique (direction, management intermédiaire, manager de proximité). Ces données sont
                            généralement renseignées par votre employeur ou par vous-même depuis votre profil.
                        </li>
                        <li>
                            <strong>Réponses aux questionnaires</strong> : échelles d'accord/désaccord (1 à 9) sur les
                            items des questionnaires Révéla (B/F/S), accompagnées d'un horodatage.
                        </li>
                        <li>
                            <strong>Scores calculés</strong> : indicateurs psychométriques dérivés de vos réponses
                            (perception de soi, ressentis, comportement).
                        </li>
                        <li>
                            <strong>Données techniques</strong> : adresse IP, identifiant de session, jeton
                            d'authentification (durée limitée).
                        </li>
                    </ul>
                </Section>

                <Section title="5. Destinataires des données">
                    <Paragraph>
                        Vos données sont accessibles, dans la limite de leurs missions respectives, à :
                    </Paragraph>
                    <ul>
                        <li>
                            <strong>Vous-même</strong>, via votre espace personnel (consultation, export, modification,
                            suppression — voir §8).
                        </li>
                        <li>
                            <strong>Le coach mandaté</strong> par votre employeur pour la campagne dans laquelle vous
                            êtes inscrit·e. Le coach n'a pas accès aux participants des autres campagnes.
                        </li>
                        <li>
                            <strong>L'administrateur technique</strong> de la plateforme (équipe AOR Conseil) à des fins
                            de support et de maintenance.
                        </li>
                        <li>
                            <strong>Sous-traitants techniques</strong> : <em>{'{{HEBERGEUR_NOM}}'}</em> (hébergement de
                            la base de données et de l'application, situé en{' '}
                            <strong>{'{{HEBERGEUR_LOCALISATION}}'}</strong>), <em>{'{{ENVOI_EMAIL_NOM}}'}</em> (envoi
                            des e-mails d'invitation).
                        </li>
                    </ul>
                    <Paragraph>
                        Vos réponses individuelles ne sont <strong>jamais transmises à votre employeur</strong> sans
                        votre accord explicite. Seul le coach a accès à vos résultats détaillés. Votre employeur ne peut
                        recevoir que des restitutions agrégées et anonymisées, à l'échelle d'une campagne.
                    </Paragraph>
                </Section>

                <Section title="6. Durée de conservation">
                    <Paragraph>
                        Vos données sont conservées pour la durée strictement nécessaire aux finalités poursuivies :
                    </Paragraph>
                    <ul>
                        <li>
                            <strong>Pendant la mission</strong> : durée d'exécution de la campagne d'évaluation.
                        </li>
                        <li>
                            <strong>Après la mission</strong> : <strong>{'{{DUREE_CONSERVATION_ACTIVE}}'}</strong> à
                            compter de la fin de la campagne, à des fins d'historique et de relecture par le coach et
                            par vous-même.
                        </li>
                        <li>
                            <strong>Archivage légal</strong> : <strong>{'{{DUREE_ARCHIVAGE_LEGAL}}'}</strong> en
                            archivage intermédiaire, le cas échéant, pour répondre à une obligation légale ou à la
                            défense d'un droit en justice.
                        </li>
                    </ul>
                    <Paragraph>
                        À l'expiration de ces durées, vos données sont supprimées définitivement ou anonymisées de
                        manière irréversible.
                    </Paragraph>
                </Section>

                <Section title="7. Sécurité">
                    <Paragraph>
                        Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos
                        données :
                    </Paragraph>
                    <ul>
                        <li>Chiffrement des échanges entre votre navigateur et nos serveurs (HTTPS/TLS).</li>
                        <li>
                            Hachage cryptographique de vos mots de passe (algorithme scrypt) — nous ne stockons jamais
                            votre mot de passe en clair.
                        </li>
                        <li>
                            Cloisonnement des données par campagne et par coach (un coach n'accède qu'aux participants
                            qui lui sont rattachés).
                        </li>
                        <li>Sauvegardes régulières et journalisation des erreurs techniques.</li>
                    </ul>
                </Section>

                <Section title="8. Vos droits">
                    <Paragraph>Conformément au RGPD, vous disposez à tout moment des droits suivants :</Paragraph>
                    <ul>
                        <li>
                            <strong>Droit d'accès</strong> (article 15) — consulter les données vous concernant.
                        </li>
                        <li>
                            <strong>Droit de rectification</strong> (article 16) — corriger les données inexactes
                            (organisation, direction, service, niveau hiérarchique) depuis votre espace.
                        </li>
                        <li>
                            <strong>Droit à l'effacement</strong> (article 17) — demander la suppression de votre compte
                            et de toutes les données associées.
                        </li>
                        <li>
                            <strong>Droit à la portabilité</strong> (article 20) — télécharger vos données dans un
                            format structuré (JSON ou PDF), depuis votre espace.
                        </li>
                        <li>
                            <strong>Droit d'opposition</strong> (article 21) — vous opposer au traitement pour des
                            motifs tenant à votre situation particulière.
                        </li>
                        <li>
                            <strong>Droit de réclamation</strong> auprès de la CNIL —{' '}
                            <MuiLink href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
                                www.cnil.fr
                            </MuiLink>
                            .
                        </li>
                    </ul>
                    <Paragraph>
                        Pour exercer vos droits, contactez le DPO à{' '}
                        <MuiLink href="mailto:{{EMAIL_DPO}}">{'{{EMAIL_DPO}}'}</MuiLink>. Une réponse vous sera apportée
                        sous un délai d'un mois maximum.
                    </Paragraph>
                </Section>

                <Section title="9. Cookies et traceurs">
                    <Paragraph>
                        Le service utilise un nombre minimal de cookies, strictement nécessaires à son fonctionnement :
                        cookie d'authentification (jeton de session) et cookie de préférence linguistique. Aucun cookie
                        de mesure d'audience tiers, de publicité ciblée ou de profilage commercial n'est déposé.
                    </Paragraph>
                    <Paragraph>
                        Les polices typographiques sont chargées depuis Google Fonts ; à ce titre, votre adresse IP peut
                        être transmise à Google lors de l'affichage des pages.
                    </Paragraph>
                </Section>

                <Section title="10. Modifications">
                    <Paragraph>
                        La présente politique peut être mise à jour pour refléter des évolutions techniques ou
                        réglementaires. La date de dernière modification figure en haut de cette page. En cas de
                        changement significatif affectant vos droits, vous serez informé·e par e-mail et/ou par une
                        notification dans votre espace.
                    </Paragraph>
                </Section>
            </Stack>
        </Container>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box component="section">
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                {title}
            </Typography>
            <Box
                sx={{
                    color: 'text.secondary',
                    lineHeight: 1.75,
                    '& ul': { pl: 3, mt: 1, mb: 1 },
                    '& li': { mb: 0.75 },
                    '& strong': { color: 'text.primary' },
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

function Paragraph({ children }: { children: React.ReactNode }) {
    return (
        <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.75 }} component="p">
            {children}
        </Typography>
    );
}
