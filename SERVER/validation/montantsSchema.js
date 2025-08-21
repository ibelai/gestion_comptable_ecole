const Joi = require('joi');

// Schéma pour les ÉTUDIANTS (ancien montantSchema)
const etudiantSchema = Joi.object({
  nom: Joi.string().required(),
  prenom: Joi.string().required(),
  matricule: Joi.string().required(),
  classe_id: Joi.number().required(),
  trimestre: Joi.string().required(),
  date_naissance: Joi.date().allow(null, ''),
  genre: Joi.string().valid('M', 'F').allow(null, ''),
  statut_affectation: Joi.string().valid('affecté', 'non affecté').allow(null, '')
});

// Schéma pour les MONTANTS de CLASSES (corrigé pour utiliser classe_id)
const montantSchema = Joi.object({
  classe_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'L\'ID de la classe doit être un nombre',
      'number.integer': 'L\'ID de la classe doit être un entier',
      'number.positive': 'L\'ID de la classe doit être positif',
      'any.required': 'L\'ID de la classe est obligatoire'
    }),

  montant: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'any.required': 'Le montant est obligatoire'
    }),

  annee_scolaire: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'L\'année scolaire est requise',
      'any.required': 'L\'année scolaire est obligatoire'
    }),

  statut_affectation: Joi.string()
    .trim()
    .valid('affecté', 'non affecté')
    .required()
    .messages({
      'any.only': 'Le statut d\'affectation doit être "affecté" ou "non affecté"',
      'any.required': 'Le statut d\'affectation est obligatoire'
    })
});

// Schéma pour la mise à jour d'un montant
const montantUpdateSchema = Joi.object({
  montant: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'any.required': 'Le montant est obligatoire'
    })
});

// Schéma pour créer une classe avec montant (route /classes/avec-montant)
// Celui-ci utilise "nom" car on crée d'abord la classe puis le montant
const classeAvecMontantSchema = Joi.object({
  nom: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de la classe est requis',
      'any.required': 'Le nom de la classe est obligatoire'
    }),

  montant: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'any.required': 'Le montant est obligatoire'
    }),

  annee_scolaire: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'L\'année scolaire est requise',
      'any.required': 'L\'année scolaire est obligatoire'
    }),

  statut_affectation: Joi.string()
    .trim()
    .valid('affecté', 'non affecté')
    .required()
    .messages({
      'any.only': 'Le statut d\'affectation doit être "affecté" ou "non affecté"',
      'any.required': 'Le statut d\'affectation est obligatoire'
    })
});

// NOUVEAU: Schéma alternatif si vous voulez utiliser le nom de classe au lieu de l'ID
// (nécessite une modification de la logique dans le contrôleur)
const montantAvecNomClasseSchema = Joi.object({
  classe: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Le nom de la classe est requis',
      'any.required': 'Le champ classe est obligatoire'
    }),

  montant: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'any.required': 'Le montant est obligatoire'
    }),

  annee_scolaire: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'L\'année scolaire est requise',
      'any.required': 'L\'année scolaire est obligatoire'
    }),

  statut_affectation: Joi.string()
    .trim()
    .valid('affecté', 'non affecté')
    .required()
    .messages({
      'any.only': 'Le statut d\'affectation doit être "affecté" ou "non affecté"',
      'any.required': 'Le statut d\'affectation est obligatoire'
    })
});

module.exports = { 
  montantSchema,                    // Pour POST /montants (utilise classe_id)
  montantUpdateSchema,             // Pour PUT /montants/:id
  classeAvecMontantSchema,         // Pour POST /classes/avec-montant (utilise nom)
  montantAvecNomClasseSchema,      // Alternative si vous voulez garder le nom de classe
  etudiantSchema                   // Gardé pour compatibilité
};