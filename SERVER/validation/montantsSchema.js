const Joi = require('joi');

const montantSchema = Joi.object({
  classe: Joi.string().min(1).required(),
  montant: Joi.number().positive().required(),
  annee_scolaire: Joi.string().pattern(/^\d{4}-\d{4}$/).required(), // Exemple: 2023-2024
});

const montantUpdateSchema = Joi.object({
  montant: Joi.number().positive().required(),
});

module.exports = { montantSchema, montantUpdateSchema };
