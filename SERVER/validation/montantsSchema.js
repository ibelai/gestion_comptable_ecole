const Joi = require('joi');

const montantSchema = Joi.object({
  nom: Joi.string().required(),
  prenom: Joi.string().required(),
  matricule: Joi.string().required(),
  classe_id: Joi.number().required(),
  trimestre: Joi.string().required(),
  date_naissance: Joi.date().allow(null, ''),
  genre: Joi.string().valid('M', 'F').allow(null, ''),
  statut_affectation: Joi.string().valid('affecté', 'non affecté').allow(null, '')
});



const montantUpdateSchema = Joi.object({
  montant: Joi.number().positive().required(),
});

module.exports = { montantSchema, montantUpdateSchema };
