const express = require('express');
const router = express.Router();
const montantController = require('../controllers/montantControllers');

router.get('/', montantController.getAllMontants);
router.get('/:classe_id', montantController.getMontantByClasse);
router.post('/', montantController.createOrUpdateMontant);

module.exports = router;
