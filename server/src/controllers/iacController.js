const IacExecution = require("../models/IacExecution");
const Project = require("../models/Project");
const iacService = require("../services/iacService");
const { cloudNativeQueue } = require("../queues/cloudNativeQueue");

const triggerIacOperation = async (req, res) => {
  const { projectId, iacType, operation, templateName } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // 1. Generate files based on IaC type
    let configFiles = {};
    if (iacType === "terraform") {
      configFiles = iacService.generateTerraformFiles(templateName || "aws-ec2");
    } else {
      configFiles = iacService.generatePulumiFiles(templateName || "aws-ec2");
    }

    // 2. Create Execution record
    const execution = await IacExecution.create({
      projectId,
      type: iacType,
      operation,
      status: "running",
      configFiles,
      triggeredBy: req.user._id,
      logs: [
        { message: `Initializing ${iacType} ${operation}...`, level: "info" }
      ]
    });

    // 3. Queue the task to BullMQ for simulated background completion
    await cloudNativeQueue.add(
      "iac-job",
      {
        executionId: execution._id.toString(),
        iacType,
        operation
      },
      { removeOnComplete: true }
    );

    res.status(202).json({
      success: true,
      message: `${iacType.toUpperCase()} ${operation} queued successfully.`,
      executionId: execution._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Execution trigger failed", details: error.message });
  }
};

const getIacExecutions = async (req, res) => {
  try {
    const executions = await IacExecution.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .populate("triggeredBy", "name");
    res.json(executions);
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

const getIacState = async (req, res) => {
  try {
    const execution = await IacExecution.findById(req.params.id);
    if (!execution) {
      return res.status(404).json({ success: false, error: "IaC execution record not found" });
    }
    res.json({
      executionId: execution._id,
      type: execution.type,
      configFiles: execution.configFiles,
      stateFile: execution.stateFile || "{}"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Query failed", details: error.message });
  }
};

module.exports = {
  triggerIacOperation,
  getIacExecutions,
  getIacState
};
