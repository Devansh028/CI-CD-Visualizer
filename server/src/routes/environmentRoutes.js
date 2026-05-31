const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { checkProjectRole } = require("../middleware/rbacMiddleware");
const {
  getProjectVariables,
  postProjectVariable,
  putProjectVariable,
  deleteProjectVariable,
} = require("../controllers/environmentController");
const { envVariableValidation, mongoIdParamValidation } = require("../middleware/validationMiddleware");

// Enable mergeParams to inherit parameters (like :projectId) from parent routes
const router = express.Router({ mergeParams: true });

// Require JWT authentication for all environment settings
router.use(protect);

router.get(
  "/:projectId/env", 
  mongoIdParamValidation("projectId"), 
  checkProjectRole(["owner", "admin", "developer", "viewer"]), 
  getProjectVariables
);

router.post(
  "/:projectId/env", 
  mongoIdParamValidation("projectId"), 
  envVariableValidation, 
  checkProjectRole(["owner", "admin", "developer"]), 
  postProjectVariable
);

router.put(
  "/:projectId/env/:envId", 
  mongoIdParamValidation("projectId"), 
  mongoIdParamValidation("envId"), 
  envVariableValidation, 
  checkProjectRole(["owner", "admin", "developer"]), 
  putProjectVariable
);

router.delete(
  "/:projectId/env/:envId", 
  mongoIdParamValidation("projectId"), 
  mongoIdParamValidation("envId"), 
  checkProjectRole(["owner", "admin", "developer"]), 
  deleteProjectVariable
);

module.exports = router;

