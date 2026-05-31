const fs = require("fs");
const path = require("path");

/**
 * Returns synthesized Terraform configuration files (.tf) based on target template.
 */
const generateTerraformFiles = (templateName, variables = {}) => {
  const configs = {
    main: "",
    variables: "",
    outputs: ""
  };

  switch (templateName.toLowerCase()) {
    case "aws-ec2":
      configs.main = `provider "aws" {
  region = var.aws_region
}

resource "aws_instance" "app_server" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = {
    Name = var.instance_name
  }
}`;
      configs.variables = `variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "ami_id" {
  type    = string
  default = "ami-0c55b159cbfafe1f0"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "instance_name" {
  type    = string
  default = "CCVInstance"
}`;
      configs.outputs = `output "instance_id" {
  value = aws_instance.app_server.id
}

output "instance_public_ip" {
  value = aws_instance.app_server.public_ip
}`;
      break;

    case "aws-eks":
      configs.main = `provider "aws" {
  region = var.aws_region
}

module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  version         = "19.15.3"
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  subnet_ids      = var.subnet_ids
  vpc_id          = var.vpc_id

  eks_managed_node_groups = {
    default = {
      min_size     = var.min_nodes
      max_size     = var.max_nodes
      desired_size = var.desired_nodes
      instance_types = [var.node_instance_type]
    }
  }
}`;
      configs.variables = `variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "cluster_name" {
  type    = string
  default = "ccv-production-cluster"
}

variable "cluster_version" {
  type    = string
  default = "1.27"
}

variable "min_nodes" {
  type    = number
  default = 1
}

variable "max_nodes" {
  type    = number
  default = 3
}

variable "desired_nodes" {
  type    = number
  default = 2
}

variable "node_instance_type" {
  type    = string
  default = "t3.medium"
}`;
      configs.outputs = `output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  value = module.eks.cluster_security_group_id
}`;
      break;

    default:
      // Default to Kubernetes resources (general)
      configs.main = `provider "kubernetes" {
  config_path = "~/.kube/config"
}

resource "kubernetes_namespace" "app_ns" {
  metadata {
    name = var.namespace
  }
}`;
      configs.variables = `variable "namespace" {
  type    = string
  default = "ccv-app"
}`;
      configs.outputs = `output "namespace_name" {
  value = kubernetes_namespace.app_ns.metadata[0].name
}`;
  }

  return {
    "main.tf": configs.main,
    "variables.tf": configs.variables,
    "outputs.tf": configs.outputs
  };
};

/**
 * Returns synthesized Pulumi config files (index.ts, Pulumi.yaml)
 */
const generatePulumiFiles = (templateName, lang = "typescript") => {
  const code = `import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create a new security group for port 80
const sg = new aws.ec2.SecurityGroup("web-secgrp", {
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

// Create EC2 Instance
const server = new aws.ec2.Instance("web-server", {
    instanceType: "t2.micro",
    securityGroups: [ sg.name ],
    ami: "ami-0c55b159cbfafe1f0", // Amazon Linux 2 AMI
});

export const publicIp = server.publicIp;
export const publicHostName = server.publicDns;
`;

  return {
    "index.ts": code,
    "Pulumi.yaml": `name: ccv-iac-project\nruntime: nodejs\ndescription: A Pulumi program to deploy ec2 instances`
  };
};

module.exports = {
  generateTerraformFiles,
  generatePulumiFiles
};
