const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const IacExecution = require("../models/IacExecution");
const logger = require("../utils/logger");

/**
 * BullMQ Worker processing cloud infrastructure provisioning and configuration jobs.
 */
const startCloudNativeWorker = () => {
  const worker = new Worker(
    "cloud-native-queue",
    async (job) => {
      const { executionId, iacType, operation } = job.data;
      
      logger.info(`[CloudNativeWorker] Processing job ${job.id}. Execution: ${executionId}`);

      const execution = await IacExecution.findById(executionId);
      if (!execution) {
        throw new Error(`IaC execution record not found: ${executionId}`);
      }

      // Simulate step-by-step progress logging
      const addLog = async (msg, level = "info") => {
        execution.logs.push({ timestamp: new Date(), message: msg, level });
        await execution.save();
      };

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      try {
        await sleep(1000);
        await addLog(`[${iacType.toUpperCase()}] Running CLI validation check...`);
        
        await sleep(1000);
        await addLog(`[${iacType.toUpperCase()}] Backend remote state sync initiated...`);

        if (operation === "plan") {
          await sleep(1500);
          await addLog(`[${iacType.toUpperCase()}] Planning infrastructure changes. Syncing resources...`);
          await addLog(`[${iacType.toUpperCase()}] Plan: 2 resources to add, 0 to change, 0 to destroy.`);
        } else if (operation === "apply") {
          await sleep(2000);
          await addLog(`[${iacType.toUpperCase()}] Provisioning security policies and instance networks...`);
          await sleep(1000);
          await addLog(`[${iacType.toUpperCase()}] Constructing target cloud instances...`);
          
          // Generate a mock state file
          execution.stateFile = JSON.stringify({
            version: 4,
            terraform_version: "1.5.0",
            serial: 1,
            lineage: "24dfa98c-3c8f-287d-1c9f-395d314ad31b",
            resources: [
              {
                mode: "managed",
                type: "aws_instance",
                name: "app_server",
                provider: "provider[\"registry.terraform.io/hashicorp/aws\"]",
                instances: [
                  {
                    schema_version: 1,
                    attributes: {
                      id: "i-09df8c8a14b301f2f",
                      arn: "arn:aws:ec2:us-east-1:123456789012:instance/i-09df8c8a14b301f2f",
                      instance_type: "t2.micro",
                      public_ip: "54.210.12.8",
                      tags: { Name: "CCVInstance" }
                    }
                  }
                ]
              }
            ]
          }, null, 2);
        } else {
          // destroy
          await sleep(2000);
          await addLog(`[${iacType.toUpperCase()}] Tearing down security configurations...`);
          await sleep(1000);
          await addLog(`[${iacType.toUpperCase()}] Terminating remote cloud VM instances...`);
          execution.stateFile = "{}";
        }

        execution.status = "success";
        execution.duration = Math.round((Date.now() - execution.createdAt.getTime()) / 1000);
        await addLog(`[${iacType.toUpperCase()}] Execution completed successfully in ${execution.duration}s.`, "success");
        await execution.save();
      } catch (err) {
        execution.status = "failed";
        await addLog(`[${iacType.toUpperCase()}] Execution failed: ${err.message}`, "error");
        await execution.save();
        throw err;
      }
    },
    {
      connection: redisConnection
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(`[CloudNativeWorker] Job ${job ? job.id : "unknown"} failed: ${err.message}`);
  });

  logger.info("BullMQ Cloud Native Worker connected to 'cloud-native-queue' and ready to process jobs.");
  return worker;
};

module.exports = {
  startCloudNativeWorker
};
