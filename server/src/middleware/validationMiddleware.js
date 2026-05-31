const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

// Validator response mapper: converts validationResult errors into clean AppError payloads
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsgs = errors.array().map((err) => `${err.path}: ${err.msg}`).join(". ");
    return next(new AppError(`Validation failed: ${errorMsgs}`, 400));
  }
  next();
};

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validate
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  validate
];

const projectValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 2 })
    .withMessage("Project name must be at least 2 characters long"),
  body("repoUrl")
    .trim()
    .notEmpty()
    .withMessage("GitHub repository URL is required")
    .matches(/^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?\/?$/)
    .withMessage("Must be a valid GitHub repository URL"),
  body("branch")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Branch name cannot be empty"),
  body("framework")
    .optional()
    .trim()
    .isString()
    .withMessage("Framework must be a string"),
  body("dockerfilePath")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Dockerfile path cannot be empty"),
  body("deployPort")
    .notEmpty()
    .withMessage("Deploy port is required")
    .isInt({ min: 1, max: 65535 })
    .withMessage("Port must be an integer between 1 and 65535"),
  validate
];

const envVariableValidation = [
  body("key")
    .trim()
    .notEmpty()
    .withMessage("Key is required")
    .matches(/^[A-Z_][A-Z0-9_]*$/)
    .withMessage("Key must contain only uppercase letters, numbers, and underscores, starting with a letter or underscore"),
  body("value")
    .exists()
    .withMessage("Value is required")
    .isString()
    .withMessage("Value must be a string"),
  body("isSecret")
    .optional()
    .isBoolean()
    .withMessage("isSecret must be a boolean value"),
  validate
];

const mongoIdParamValidation = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ObjectID format for parameter ${paramName}`),
  validate
];

module.exports = {
  registerValidation,
  loginValidation,
  projectValidation,
  envVariableValidation,
  mongoIdParamValidation
};
