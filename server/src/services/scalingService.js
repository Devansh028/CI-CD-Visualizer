const ScalingPolicy = require("../models/ScalingPolicy");
const ScalingEvent = require("../models/ScalingEvent");
const Project = require("../models/Project");

/**
 * Evaluates active scaling policies and returns current replica counts and scaling state.
 */
const checkAndScaleResource = async (projectId, currentReplicas, cpuUsage, memoryUsage) => {
  const policy = await ScalingPolicy.findOne({ projectId, enabled: true });
  if (!policy) return { scaleTriggered: false, replicas: currentReplicas };

  let scaleTriggered = false;
  let targetReplicas = currentReplicas;
  let action = "";
  let reason = "";

  const threshold = policy.targetThreshold;
  
  // Scale up if usage > threshold
  if (cpuUsage > threshold || memoryUsage > threshold) {
    if (currentReplicas < policy.maxReplicas) {
      targetReplicas = Math.min(policy.maxReplicas, currentReplicas + 1);
      scaleTriggered = true;
      action = "scale-up";
      reason = `Resource usage exceeded target threshold of ${threshold}%. CPU: ${cpuUsage}%, RAM: ${memoryUsage}%`;
    }
  } 
  // Scale down if usage < threshold - 30% (cooldown boundary)
  else if (cpuUsage < (threshold - 30) && memoryUsage < (threshold - 30)) {
    if (currentReplicas > policy.minReplicas) {
      targetReplicas = Math.max(policy.minReplicas, currentReplicas - 1);
      scaleTriggered = true;
      action = "scale-down";
      reason = `Resource usage dropped below safe threshold of ${threshold - 30}%. CPU: ${cpuUsage}%, RAM: ${memoryUsage}%`;
    }
  }

  if (scaleTriggered) {
    // Record Scaling Event in database
    await ScalingEvent.create({
      projectId,
      policyId: policy._id,
      action,
      fromReplicas: currentReplicas,
      toReplicas: targetReplicas,
      reason
    });

    // Update Project Status if needed
    const project = await Project.findById(projectId);
    if (project) {
      project.status = "active";
      await project.save();
    }
  }

  return {
    scaleTriggered,
    replicas: targetReplicas,
    action,
    reason
  };
};

/**
 * Returns mock resource metric logs (for charts).
 */
const getMetricsTelemetry = (projectId) => {
  const metrics = [];
  const baseCpu = 45;
  const baseMem = 60;

  for (let i = 15; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 1000);
    const label = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
    
    // Simulate spike at index 5 to demonstrate scaling trigger
    const noise = (Math.random() - 0.5) * 10;
    const cpu = i === 5 ? 85 : Number((baseCpu + noise).toFixed(1));
    const memory = i === 5 ? 78 : Number((baseMem + noise * 0.5).toFixed(1));
    const requestRate = i === 5 ? 420 : Math.round(150 + Math.random() * 80);

    metrics.push({ label, cpu, memory, requestRate });
  }

  return metrics;
};

/**
 * Generates Kubernetes HPA (HorizontalPodAutoscaler) manifest content.
 */
const generateHpaYaml = (projectName, minReplicas, maxReplicas, targetCpuPercent) => {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  
  return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${targetCpuPercent}
`;
};

module.exports = {
  checkAndScaleResource,
  getMetricsTelemetry,
  generateHpaYaml
};
