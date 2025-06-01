const express = require('express');
const router = express.Router();
const fraisController = require('../controllers/fraissControllers');

router.get('/', fraisController.getAllFrais);
router.post('/', fraisController.createFrais);
router.put('/:id', fraisController.updateFrais);
router.delete('/:id', fraisController.deleteFrais);

module.exports = router;
