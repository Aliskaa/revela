#!/bin/bash

# Concatène toutes les règles Cursor (.cursor/rules/*.mdc) dans un fichier unique pour
# revue/audit. Toujours résolu depuis la racine du repo (peu importe le cwd d'exécution).

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

OUTPUT_FILE="combined_cursor_rules.txt"

# Vider le fichier s'il existe
echo "# SYNTHÈSE DES RÈGLES DE DÉVELOPPEMENT - $(date +%Y-%m-%d)" > $OUTPUT_FILE
echo "" >> $OUTPUT_FILE

# Trouver tous les fichiers .mdc (ou .md si tes règles sont en .md)
RULES_PATH=".cursor/rules"

if [ ! -d "$RULES_PATH" ]; then
    echo "Erreur : Le dossier $RULES_PATH n'existe pas."
    exit 1
fi

echo "Extraction des règles depuis $RULES_PATH..."

for file in "$RULES_PATH"/*.mdc; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        echo "------------------------------------------------------------" >> $OUTPUT_FILE
        echo "FILE: $filename" >> $OUTPUT_FILE
        echo "------------------------------------------------------------" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
        
        # Ajoute le contenu du fichier
        cat "$file" >> $OUTPUT_FILE
        
        echo "" >> $OUTPUT_FILE
        echo "--- END OF $filename ---" >> $OUTPUT_FILE
        echo "" >> $OUTPUT_FILE
    fi
done

echo "Terminé ! Toutes les règles sont dans $OUTPUT_FILE"