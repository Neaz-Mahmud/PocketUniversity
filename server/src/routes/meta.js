const express = require('express');
const { DIVISIONS } = require('../data/bangladesh');
const { UNIVERSITIES } = require('../data/universities');

const router = express.Router();

// Public reference data used by book listing filters/forms and student profiles.
router.get('/geo', (req, res) => res.json({ divisions: DIVISIONS }));
router.get('/universities', (req, res) => res.json({ universities: UNIVERSITIES }));

module.exports = router;
