# PV de Surveillance - Procédure d'Utilisation

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Sécurité et Accès](#sécurité-et-accès)
3. [Étapes de Fonctionnement](#étapes-de-fonctionnement)
4. [Descriptions des Sections](#descriptions-des-sections)
5. [Gestion des Données](#gestion-des-données)
6. [Génération du PDF](#génération-du-pdf)
7. [Contrôle de Qualité](#contrôle-de-qualité)
8. [Archivage et Conformité](#archivage-et-conformité)

---

## Vue d'Ensemble

### Objectif du Programme
Le programme "PV de Surveillance - Génération PDF" est une application de gestion de procès-verbaux d'inspection douanière. Il permet de :
- Documenter les inspections de conteneurs
- Enregistrer les éléments prélevés par la douane
- Compiler les constatations d'inspection
- Générer automatiquement des rapports PDF professionnels et conformes

### Utilisateurs Cibles
- Agents d'inspection douanière
- Transitaires et commissionnaires
- Responsables de port
- Personnels impliqués dans l'inspection de marchandises

### Conformité
Ce programme suit les normes de documentation des inspections douanières et génère des rapports conformes aux exigences réglementaires algériennes.

---

## Sécurité et Accès

### Protection par Code d'Accès
**Mesure de Sécurité Obligatoire**

Le programme est protégé par un code d'accès à usage obligatoire :
- **Code d'accès actuel** : 121012
- **Fonctionnement** : Un écran de verrouillage s'affiche au démarrage
- **Procédure** : Entrez le code à 6 chiffres et appuyez sur "Déverrouiller"
- **Tentatives échouées** : Un message d'erreur apparaît permettant une nouvelle tentative

**Justification de Sécurité :**
- Protège l'accès aux formulaires sensibles
- Empêche les modifications non autorisées
- Assure l'intégrité des données d'inspection
- Auditabilité : Seuls les utilisateurs autorisés peuvent accéder

### Gestion des Identifiants
- **Modification du code** : Possible via le fichier de configuration (demander à l'administrateur système)
- **Documentation** : Chaque accès doit être enregistré dans les logs système
- **Responsabilité** : Chaque utilisateur est responsable de la confidentialité de son code

---

## Étapes de Fonctionnement

### Flux Global du Programme

```
1. Déverrouillage (Code d'accès)
        ↓
2. Remplissage du formulaire principal
        ↓
3. Entrée des conteneurs inspectés
        ↓
4. (Optionnel) Entrée des colis ouverts
        ↓
5. (Optionnel) Documentation des prélèvements douaniers
        ↓
6. Sélection et organisation des constatations
        ↓
7. Upload du dossier photos
        ↓
8. Génération du PDF
        ↓
9. Téléchargement du rapport
```

### Étape 1 : Déverrouillage de l'Application
1. Ouvrez l'application
2. Un écran modal s'affiche avec un champ "Code d'accès"
3. Entrez le code à 6 chiffres
4. Cliquez sur "Déverrouiller"
5. L'application se déverrouille et vous pouvez accéder au formulaire

**Contrôles de Validation :**
- Le code doit correspondre exactement
- Aucun délai de blocage après tentative échouée
- Utilisateur peut réessayer immédiatement

---

## Descriptions des Sections

### Section 1 : Informations Générales

#### Champs Obligatoires Information Générale

| Champ | Type | Format Attendu | Justification |
|-------|------|-----------------|---------------|
| **N° de PV** | Texte | Numéro unique | Identification du procès-verbal |
| **Client** | Sélection | Dropdown (liste prédéfinie) | Traçabilité de l'importateur |
| **Transitaire** | Texte | Nom de la société | Responsable de l'acheminement |
| **Date d'intervention** | Date | JJ/MM/AAAA | Traçabilité temporelle |
| **Lieu d'intervention** | Sélection | Dropdown ou texte libre | Localisation de l'inspection |
| **Facture N°** | Texte | Numéro de facture | Traçabilité commerciale |
| **BL N°** | Texte | Bill of Lading | Référence d'expédition |

#### Remplissage Auto-Sélection Clients
Selon le client sélectionné, les champs suivants se remplissent automatiquement :

**DECATHLON EL DJAZAIR**
- Transitaire : MOUGAS
- Nature de marchandise : Articles de sport

**SCHNEIDER ELECTRIC ALGERIE**
- Transitaire : Transit Kherrat
- Nature de marchandise : Matériel électrique
- Activation : Section "Colis ouverts (Schneider)"

**STELLANTIS**
- Transitaire : TRANS VN
- Nature de marchandise : Pièces de rechange automobile

**Clients Personnalisés**
- Remplissage manuel des champs transitaire et nature

### Section 2 : Détails de Livraison

| Champ | Type | Description |
|-------|------|-------------|
| **Nombre de colis** | Texte | Total des unités inspectées |
| **Conditionnement** | Dropdown | Format d'emballage (Cartons, Palettes, Vrac, Cartons-Palettisés) |
| **Nature de marchandise** | Texte | Description de la marchandise |
| **Navire** | Texte | Nom du navire transporteur |
| **Date d'arrivée** | Date | Date de déchargement au port |
| **Port de chargement** | Texte | Port d'embarquement |
| **Port de déchargement** | Texte | Port d'Alger (défaut) |
| **Gros/Article** | Texte | Poids ou nombre d'articles |

### Section 3 : Identification des Conteneurs

**Procédure Obligatoire**

Cette section confirme les conteneurs inspectés :

1. **Ajouter des conteneurs** : Cliquez sur "Ajouter un conteneur" pour chaque conteneur inspecté
2. **Remplissez les champs obligatoires** :
   - **TC N°** : Numéro complet du conteneur (ex: MSCU1234567)
   - **N° de scellé** : Numéro du sceau/cachet apposé (ex: SEAL12345)
3. **Suppression** : Cliquez "Supprimer" pour retirer un conteneur (sauf le premier)
4. **Validation** : Tous les conteneurs doivent avoir les deux champs complétés

**Justification :**
- Identification unique de chaque unité de transport
- Preuves incontestables du contrôle des scellés
- Traçabilité pour audit douanier

### Section 4 : Colis Ouverts (Spécifique Schneider)

**Apparition Conditionnelle**

Cette section n'apparaît QUE si le client sélectionné est "SCHNEIDER ELECTRIC ALGERIE".

**Procédure :**

1. Cliquez sur le checkbox : "Des colis ouverts pendant l'inspection"
2. Remplissez les lignes pour chaque colis ouvert :
   - **ID colis** : Identifiant unique (ex: COLIS-001)
   - **Statut/Observation** : RAS (Rien À Signaler) ou description du problème
3. Cliquez "Ajouter un colis ouvert" pour ajouter des lignes supplémentaires

**Justification :**
- Documentation des colis inspectés physiquement
- Signalement de tout écart ou anomalie
- Traçabilité des inspections physiques approfondie

### Section 5 : Prélèvements Douaniers

**Procédure d'Utilisation**

1. **Activation** : Cochez "Des prélèvements ont été effectués par la douane"
2. **Présentation** : Une zone bleue confirme que la section est active
3. **Remplissage** (pour chaque article prélevé) :
   - **Article prélevé** : Nom de ce qui a été prélevé (ex: Ballons)
   - **ID/Référence** : Code de référence du prélèvement
   - **Nombre prélevé** : Quantité exacte

4. **Gestion des lignes** :
   - Cliquez "Ajouter un élément prélevé" pour ajouter des prélèvements
   - Cliquez "Supprimer" pour retirer une ligne

**Important :** Cette section reste masquée jusqu'à l'activation du checkbox.

**Justification :**
- Traçabilité des échantillons prélevés
- Documentation conforme aux réglementations douanières
- Justification des analyses ultérieures

### Section 6 : Constatations

**Gestion Flexible des Observations**

#### Constatations Prédéfinies
La liste contient 6 constatations standard pré-cochées :
1. Après pointage, vérification et ouverture...
2. Le conteneur a subi une visite intégrale...
3. Les colis ont été ouverts sur demande...
4. À l'ouverture des colis, marchandise à l'état neuf...
5. L'emballage a été déchiré pour inspection...
6. Aucune anomalie apparente n'a été constatée...

**Adaptation Automatique :**
- Si plusieurs conteneurs : utilise "conteneurs" et "Les conteneurs"
- Si un seul conteneur : utilise "conteneur" et "Le conteneur"

#### Réorganisation des Constatations

**Procédure de Drag-and-Drop :**

1. **Activation du drag** : Survolez une ligne de constatation
2. **Apparition du curseur** : Une icône de six points (⋮⋮⋮) apparaît
3. **Glissez-déposez** : Cliquez et maintenez, puis déplacez à la position désirée
4. **Feedback visuels** :
   - La ligne devient semi-transparente pendant le drag
   - La destination cible s'illumine en orange
5. **Validation** : Relâchez pour confirmer le nouvel ordre

**Justification :**
- Flexibilité dans la présentation des constatations
- Ordre logique adapté à chaque inspection
- Améliore la lisibilité du rapport final

#### Ajout de Constatations Personnalisées

1. **Champ de saisie** : "Ajouter une constatation personnalisée"
2. **Saisie** : Entrez votre texte personnalisé
3. **Ajout** : 
   - Cliquez le bouton "Ajouter" OU
   - Appuyez sur Entrée
4. **Suppression** : Les constatations personnalisées ont un bouton "Supprimer" rouge

#### Gestion des Cochages

1. **Sélection** : Cochez/décochez selon les éléments applicables
2. **Filtrage réel** : Seules les constatations cochées apparaîtront dans le PDF
3. **Constatations obligatoires** : Par défaut, toutes sont cochées

**Justification :**
- Personnalisation des rapports selon le contexte
- Seulement les observations pertinentes dans le PDF
- Conformité aux spécificités de chaque inspection

---

## Section 7 : Dossier Photos

### Procédure d'Upload

1. **Localisation** : Section "Dossier photos" avec icône de dossier
2. **Sélection du dossier** :
   - Cliquez sur "Sélectionnez un dossier"
   - Une fenêtre de sélection de dossier s'ouvre
   - Naviguez vers votre dossier contenant les photos
   - Appuyez sur "Ouvrir" ou "Sélectionner"

3. **Formats acceptés** : JPG, PNG, WEBP, et autres formats image courants

4. **Feedback de statut** :
   - "Chargement des images en cours..." : Traitement en cours
   - "X image(s) prête(s) pour le rapport" : Succès
   - Message d'erreur en rouge : Aucune image valide trouvée

### Gestion des Images

#### Aperçu des Images

1. **Grille de vignettes** : Toutes les photos s'affichent en grille (2-5 colonnes selon l'écran)
2. **Numérotation** : Chaque photo est numérotée (Photo 1, Photo 2, etc.)
3. **Feedback visuel** : Les photos sont encadrées avec ombres subtiles

#### Réorganisation des Images (Drag-and-Drop)

```
Procédure Identique à celle des Constatations

1. Survolez une image
2. Le curseur passe à "grab" (main)
3. Cliquez et maintenez
4. Déplacez vers la nouvelle position
5. L'image cible s'illumine d'un anneau bleu
6. Relâchez pour confirmer

Feedback :
- Image en cours de drag : Semi-transparente et scale-down
- Destination cible : Anneau bleu (ring-2 ring-blue-200)
```

#### Suppression d'Images

1. **Bouton de suppression** : Croix rouge (×) dans le coin supérieur droit de chaque vignette
2. **Cliquez** : L'image est immédiatement supprimée
3. **Re-numérotation** : Les photos restantes sont automatiquement re-numérotées

### Important : Images Obligatoires

**Validation :**
- Le CSV "Générer le PV" reste désactivé tant qu'aucune image n'est chargée
- Message : "Ajoutez des images pour activer"
- Les images sont **obligatoires** pour générer un rapport valide

---

## Gestion des Données

### Stockage des Données

#### En Mémoire Navigateur
- Toutes les données du formulaire sont stockées en mémoire pendant la session
- Les images sont converties en base64 pour transmission

#### Pas de Base de Données Serveur
- Aucune donnée n'est sauvegardée sur le serveur
- Les données sont traitées uniquement pour la génération du PDF
- Après génération du PDF, les données peuvent être supprimées

### Conversion Base64
```
Procédure Interne :

Fichier Image (JPG/PNG)
        ↓
FileReader API
        ↓
Conversion en Data URL (base64)
        ↓
Intégration dans PDF
        ↓
Téléchargement
```

### Sécurité des Données

1. **Validation des Entrées** : Tous les champs texte sont validés
2. **Nettoyage Automatique** : Les espaces superflus sont supprimés
3. **Format Garantis** : Les dates et nombres sont formatés correctement
4. **Pas de Communications Externes** : Données traitées localement

---

## Génération du PDF

### Procédure de Génération

1. **Vérification des Conditions**
   - ✓ Tous les champs requis remplis
   - ✓ Tous les conteneurs identifiés
   - ✓ Au moins une image chargée
   
2. **Cliquez "Générer le PV"**
   
3. **Traitement**
   - État : "Traitement des images en cours..."
   - Spinner rotatif animé
   - Durée : Dépend du nombre d'images

4. **Génération**
   - État : "Génération du PV..."
   - Compilation de tous les éléments
   - Création du fichier PDF

5. **Téléchargement**
   - Création automatique du fichier
   - Téléchargement dans le dossier Téléchargements
   - Nom du fichier : `PV_[N°PV]_[CLIENT]_2026.pdf`

### Structure du Fichier PDF Généré

```
PDF Contient :

1. En-tête avec Logo (de public/assets/logo.png)
2. Titre et Informations Principales
3. Tableau 1 : Informations Générales
   - N° PV, Client, Transitaire, Dates, etc.
4. Tableau 2 : Détails de Livraison
   - Nombre de colis, conditionnement, ports, etc.
5. Tableau 3 : Identification des Conteneurs
   - Liste de tous les conteneurs avec scellés
6. Tableau 4 : Colis Ouverts (si applicable)
   - Détail des colis inspectés physiquement
7. Tableau 5 : Prélèvements Douaniers (si applicable)
   - Liste des articles prélevés
8. Section 6 : Constatations
   - Toutes les constatations cochées, dans l'ordre défini
9. Section 7 : Galerie de Photos
   - Toutes les images, numérotées, en grille
10. Pied de page avec Date et Signature
```

### Exemple de Nom de Fichier

`PV_044_DECATHLON_EL_DJAZAIR_2026.pdf`

Composition :
- `PV_` : Préfixe standard
- `044` : Numéro du PV (N° de PV)
- `DECATHLON_EL_DJAZAIR` : Nom du client (espaces convertis en traits de soulignement)
- `2026` : Année (fixe)
- `.pdf` : Extension

---

## Contrôle de Qualité

### Avant la Génération du PDF

#### Validations Automatiques

| Critère | Statut | Message d'Erreur |
|---------|--------|-----------------|
| Tous les champs requis complétés | ✗ | "Complétez tous les champs requis" |
| Au moins un conteneur identifié | ✗ | (Bouton désactivé) |
| Au moins une image chargée | ✗ | "Ajoutez des images pour activer" |
| Chargement en cours | ✗ | "Traitement des images en cours..." |

#### Vérifications Manuelles Recommandées

Avant de cliquer sur "Générer le PV" :

1. **Relisez les Conteneurs**
   - TC N° correct et complet
   - N° de scellé exact et lisible

2. **Vérifiez les Constatations**
   - Ordre logique de présentation
   - Seules les observations pertinentes cochées

3. **Organisez les Photos**
   - Ordre chronologique ou thématique
   - Photos de qualité suffisante
   - Toutes les photos pertinentes inclues

4. **Relisez les Dates**
   - Format cohérent
   - Pas de dates futures

---

## Archivage et Conformité

### Fichiers Générés

#### Format de Sortie
- **Type** : PDF (Portable Document Format)
- **Compression** : Optimisée pour stockage et transmission
- **Compatibilité** : Lisible sur tous les appareils/logiciels

#### Stockage Recommandé

```
Structure d'Archivage Proposée :

/Inspections/
├── 2026/
│   ├── 01_Janvier/
│   │   ├── PV_001_Client_2026.pdf
│   │   ├── PV_002_Client_2026.pdf
│   ├── 02_Février/
│   │   ├── PV_003_Client_2026.pdf
│   ...
```

### Conformité Réglementaire

#### Éléments de Conformité Inclus

1. **Traçabilité Complète**
   - Tous les éléments inspecionnés documentés
   - Dates et lieux d'inspection
   - Identification de l'inspecteur (à noter manuellement)

2. **Constatations Détaillées**
   - Descriptions précises de l'inspection
   - Observations personnalisées
   - Preuves photographiques

3. **Documentation des Anomalies**
   - Section colis ouverts
   - Prélèvements douaniers
   - Variables selon le contenu

4. **Signature Numérique**
   - À ajouter manuellement après impression si nécessaire
   - Possibilité d'impression directe pour signature officielle

### Durée de Conservation

**Conformité Douanière :**
- Minimum 3 ans
- Selon les régulations algériennes en vigueur
- À vérifier auprès des autorités douanières

### Audit et Vérification

#### Points d'Audit à Documenter

1. **Accès à l'Application**
   - Logs d'accès (code d'accès utilisé)
   - Date et heure d'accès
   - Utilisateur responsable

2. **Modifications apportées**
   - Versioning des PDF générés
   - Comparaison avant/après si modification

3. **Photos et Preuves**
   - Intégrité des images
   - Dates de capture
   - Authentification des photos

4. **Constatations**
   - Justification des éléments sélectionnés
   - Raison des constatations personnalisées
   - Ordre de présentation justifié

---

## Procédures de Dépannage

### Problème : Code d'Accès ne Fonctionne Pas

**Solution :**
- Vérifiez que le code est entré correctement (sans espaces)
- Vérifiez que Caps Lock n'est pas activé
- Réf refresher la page (F5)
- Contactez l'administrateur système

### Problème : Images ne se Chargent Pas

**Solution :**
- Vérifiez que le format est supporté (JPG, PNG, WEBP)
- Vérifiez la taille du dossier (ne doit pas être trop grande)
- Essayez avec un nombre réduit d'images
- Vérifiez la connexion Internet

### Problème : PDF ne se Génère Pas

**Solution :**
- Vérifiez que TOUS les champs requis sont complétés
- Vérifiez qu'au moins une image est chargée
- Attendez le chargement complet des images
- Videz le cache du navigateur
- Essayez avec un autre navigateur

### Problème : Le PDF est Vide ou Incomplet

**Solution :**
- Vérifiez que les données ont bien été saisies
- Rechargez la page et saisissez à nouveau
- Vérifiez les constatations cochées
- Assurez-vous que les images sont bien visibles dans l'aperçu

---

## Conclusion

Ce programme fournit une solution complète et sécurisée pour la génération de procès-verbaux d'inspection douanière conformes aux normes algériennes. 

**Avantages :**
- ✓ Automatisation de la génération de rapports
- ✓ Réduction des erreurs de saisie
- ✓ Conformité réglementaire garantie
- ✓ Archivage et traçabilité
- ✓ Protection par code d'accès
- ✓ Interface intuitive et accessible

**Responsabilités de l'Utilisateur :**
- Saisie précise et honnête des données
- Sécurité du code d'accès
- Archivage approprié des PDF
- Conformité avec les réglementations douanières locales

---

**Document Version :** 1.0  
**Date de Création :** 15 Mai 2026  
**Dernière Modification :** 15 Mai 2026  
**Auteur :** Équipe de Développement  

*Pour toute question ou correction, contactez l'administrateur système.*
