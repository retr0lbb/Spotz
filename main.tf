terraform {
    required_providers {
      azurerm = {
        source  = "hashicorp/azurerm"
        version = "~> 4.0"
      }
    }
    
    required_version = ">= 1.5.0"
}

provider "azurerm" {
    features {}
}

resource "azurerm_resource_group" "main" {
  name     = "terraform-rg-001"
  location = "Chile Central"
}