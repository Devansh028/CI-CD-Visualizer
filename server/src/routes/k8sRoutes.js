const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  connectCluster,
  getClusters,
  getNamespaces,
  createNamespace,
  deleteNamespace,
  deployManifests,
  getHelmReleases,
  installHelm,
  upgradeHelm,
  rollbackHelm,
  uninstallHelm,
  getPods,
  getPodLogs,
  getPodEvents
} = require("../controllers/k8sController");

const router = express.Router();

// All K8s routes are secure
router.use(protect);

router.post("/clusters", connectCluster);
router.get("/clusters", getClusters);

router.get("/clusters/:clusterId/namespaces", getNamespaces);
router.post("/clusters/:clusterId/namespaces", createNamespace);
router.delete("/clusters/:clusterId/namespaces/:namespace", deleteNamespace);

router.post("/deploy", deployManifests);

router.get("/clusters/:clusterId/helm", getHelmReleases);
router.post("/clusters/:clusterId/helm", installHelm);
router.put("/clusters/:clusterId/helm/:namespace/:releaseName", upgradeHelm);
router.post("/clusters/:clusterId/helm/:namespace/:releaseName/rollback", rollbackHelm);
router.delete("/clusters/:clusterId/helm/:namespace/:releaseName", uninstallHelm);

router.get("/pods", getPods);
router.get("/pods/:podName/logs", getPodLogs);
router.get("/pods/:podName/events", getPodEvents);

module.exports = router;
