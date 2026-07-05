# AI Coding Assistant Instructions for BE_ORDER_SYSTEM

## Project Overview
This is a NestJS backend application for an order management system, using Prisma ORM with MySQL database. The system manages users, tables, categories, menu items, orders, and payments for a restaurant or food service.

## Architecture
- **Framework**: NestJS with TypeScript
- **Database**: MySQL via Prisma ORM
- **Authentication**: bcrypt for password hashing
- **Validation**: class-validator for DTOs
- **Modules**: Modular structure with separate modules for each entity

## Key Components
- **PrismaService**: Global database service extending PrismaClient
- **Modules**: User, Table, Category, MenuItem, Order, Payment, OptionItem, ImageItem (each with controller, service, DTOs)
- **Entities**: Based on Prisma schema with relationships (User -> MenuItem, Table -> Order, etc.)

## Development Workflow
- **Database**: Use `npx prisma migrate dev` for schema changes, `npx prisma db seed` for seeding
- **Build**: `npm run build` (NestJS CLI)
- **Dev Server**: `npm run start:dev` (watch mode)
- **Testing**: `npm run test` (unit), `npm run test:e2e` (end-to-end)

## Conventions
- **DTOs**: Use class-validator decorators (@IsString, @IsEnum, etc.)
- **Services**: Handle business logic, database operations via PrismaService
- **Controllers**: RESTful endpoints, delegate to services
- **Modules**: Import PrismaModule globally, export services for cross-module use
- **Naming**: Kebab-case for directories (menu-item), PascalCase for classes
- **Relations**: Use Prisma connect syntax for relationships (e.g., `user: { connect: { id } }`)

## Common Patterns
- **CRUD Operations**: Standard create/findAll/findOne/update/delete in all services
- **Includes**: Always include related entities in find operations
- **Error Handling**: Use NotFoundException for missing entities
- **Password Hashing**: Use bcrypt in user service for create/update
- **Enums**: Use Prisma-generated enums (UserRole, OrderStatus, etc.)

## Database Schema Highlights
- Users have roles (customer, service, kitchen, manager, admin)
- Tables have QR codes and status (empty/occupied)
- MenuItems belong to categories and users, have images and options
- Orders contain orderItems, linked to tables and payments
- All entities use UUID primary keys

## API Endpoints
- `/users` - User management
- `/tables` - Table management
- `/categories` - Category management (ordered by sortOrder)
- `/menu-items` - Menu item CRUD, with sub-endpoints for images/options
- `/orders` - Order management, with sub-endpoints for order items
- `/payments` - Payment management
- `/option-items` - Menu item option management
- `/image-items` - Menu item image management

When adding new features, follow the established module pattern and ensure proper validation and error handling.