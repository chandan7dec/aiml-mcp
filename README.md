# AI/ML MCP Server

A Model Context Protocol (MCP) server with in-memory CRUD operations for Employee management.

## Tools

| Tool | Description |
|------|-------------|
| `create_employee` | Create a new employee (name, email, department, position, salary) |
| `get_employee` | Get single employee by ID or list all employees |
| `update_employee` | Update employee fields by ID |
| `delete_employee` | Delete an employee by ID |

## Setup

```bash
cd employee-server
npm install
npm run build
```

## Usage with VS Code

The `.vscode/mcp.json` is already configured. Just open this folder in VS Code and the MCP server will be available.
