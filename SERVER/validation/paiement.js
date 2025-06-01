const Joi = require("joi");

const paiementSchema = Joi.object({
  eleve_id: Joi.number().required(),
  montant: Joi.number().required(),
  date_paiement: Joi.date().required(),
 mode_paiement: Joi.string().allow("").optional(),

  commentaire: Joi.string().allow(""),
});


module.exports = paiementSchema;
