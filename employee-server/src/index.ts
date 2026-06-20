#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Employee interface
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  createdAt: string;
  updatedAt: string;
}

// In-memory storage for employees
const employees: Map<string, Employee> = new Map();

// Helper to generate unique ID
function generateId(): string {
  return `emp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Create MCP Server
const server = new McpServer({
  name: "employee-server",
  version: "1.0.0",
});

// Tool 1: Create Employee
server.tool(
  "create_employee",
  "Create a new employee record",
  {
    name: z.string().describe("Full name of the employee"),
    email: z.string().email().describe("Email address of the employee"),
    department: z.string().describe("Department name (e.g., Engineering, HR, Sales)"),
    position: z.string().describe("Job position/title"),
    salary: z.number().positive().describe("Annual salary"),
  },
  async ({ name, email, department, position, salary }) => {
    // Check if email already exists
    for (const emp of employees.values()) {
      if (emp.email === email) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Employee with email ${email} already exists`,
              }),
            },
          ],
        };
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    const employee: Employee = {
      id,
      name,
      email,
      department,
      position,
      salary,
      createdAt: now,
      updatedAt: now,
    };

    employees.set(id, employee);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Employee created successfully",
            employee,
          }),
        },
      ],
    };
  }
);

// Tool 2: Read/Get Employee(s)
server.tool(
  "get_employee",
  "Get employee(s) - retrieve a single employee by ID or list all employees",
  {
    id: z.string().optional().describe("Employee ID (optional). If not provided, returns all employees"),
  },
  async ({ id }) => {
    if (id) {
      // Get single employee
      const employee = employees.get(id);
      if (!employee) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: `Employee with ID ${id} not found`,
              }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              employee,
            }),
          },
        ],
      };
    } else {
      // Get all employees
      const allEmployees = Array.from(employees.values());
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: true,
              count: allEmployees.length,
              employees: allEmployees,
            }),
          },
        ],
      };
    }
  }
);

// Tool 3: Update Employee
server.tool(
  "update_employee",
  "Update an existing employee record",
  {
    id: z.string().describe("Employee ID to update"),
    name: z.string().optional().describe("New name (optional)"),
    email: z.string().email().optional().describe("New email address (optional)"),
    department: z.string().optional().describe("New department (optional)"),
    position: z.string().optional().describe("New position (optional)"),
    salary: z.number().positive().optional().describe("New salary (optional)"),
  },
  async ({ id, name, email, department, position, salary }) => {
    const employee = employees.get(id);
    
    if (!employee) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Employee with ID ${id} not found`,
            }),
          },
        ],
      };
    }

    // Check if new email conflicts with existing employee
    if (email && email !== employee.email) {
      for (const emp of employees.values()) {
        if (emp.email === email && emp.id !== id) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: `Email ${email} is already used by another employee`,
                }),
              },
            ],
          };
        }
      }
    }

    // Update fields
    const updatedEmployee: Employee = {
      ...employee,
      name: name ?? employee.name,
      email: email ?? employee.email,
      department: department ?? employee.department,
      position: position ?? employee.position,
      salary: salary ?? employee.salary,
      updatedAt: new Date().toISOString(),
    };

    employees.set(id, updatedEmployee);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Employee updated successfully",
            employee: updatedEmployee,
          }),
        },
      ],
    };
  }
);

// Tool 4: Delete Employee
server.tool(
  "delete_employee",
  "Delete an employee record",
  {
    id: z.string().describe("Employee ID to delete"),
  },
  async ({ id }) => {
    const employee = employees.get(id);
    
    if (!employee) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Employee with ID ${id} not found`,
            }),
          },
        ],
      };
    }

    employees.delete(id);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            message: "Employee deleted successfully",
            deletedEmployee: employee,
          }),
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Employee MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
