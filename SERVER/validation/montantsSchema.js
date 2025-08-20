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

// Schéma pour les MONTANTS de CLASSES (ce dont vous avez besoin)
const montantSchema = Joi.object({
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

module.exports = { 
  montantSchema,           // Pour POST /montants (table montants_classes)
  montantUpdateSchema,     // Pour PUT /montants/:id
  classeAvecMontantSchema, // Pour POST /classes/avec-montant
  etudiantSchema          // Gardé pour compatibilité si vous l'utilisez ailleurs
};