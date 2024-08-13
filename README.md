## Description

An application called the Staff Salary Calculation System uses NestJS to store and compute wages for various staff jobs (Sales, Manager, and Employee) based on the salaries of their direct reports, tenure, and base pay. Included in this system are:

Service Layer works with business logic.

Repository layer works with database.

Controller Layer handles requests and responses from HTTP.

## Features

Salary Calculation: Calculates salary value according to role.

Supports sales, management, and employee responsibilities in role handling.

Testing: Contains Jest unit tests.

## Architecture

The application's framework is NestJS.

The database SQLite is used to store personnel data.

ORM for database use is TypeORM.

## Advantages

Clear Structure: The service, repository, and controller layers of the code are arranged independently.

Efficient Testing: Without a real database, tests verify the fundamental logic using mock data.

Advantages of TypeScript: TypeScript makes the code more reliable and helps recognize problems.

## Enhancements

Improved Mocks: Not everything is covered in the present mocks. 
More complex mocks or integration tests with an actual or in-memory database are required for real-world use.

Enhanced Error Handling: To better deal with problems (such as missing data), enhance error handling at the service layer.

Scalability: The system is designed for small data.


## Installation

### Prerequisites

  Node.js (v16 or later)
  npm (v8 or later) or yarn
  
## Running the app
Clone the repo
```bash
git clone https://github.com/booravch1que/test_task_DBB.git
cd test_task_DBB
```

Install the dependencies

```bash
$ npm install
```

Start the program
```bash
$ npm run start
```

## Test

```bash
# unit tests
$ npm run test
```

## Endpoints
### Get Staff by ID

Endpoint: GET /staff/:id
Description: Retrieves a staff member by ID.

### Calculate Salary

Endpoint: GET /staff/:id/salary
Description: Calculates the salary for a staff member based on their role, salary, date to count from, and subordinate salaries.

(PUT THE DATE IN QUERY - example : /staff/total-salary?date=YYYY-MM-DD)


### Calculate Total Salary

Endpoint: GET /staff/total-salary
Description: Calculates the salary for a staff member based on their role, salary, date to count from, and subordinate salaries.

(PUT THE DATE IN QUERY - example : /staff/total-salary?date=YYYY-MM-DD)

### Create Staff Member

Endpoint: POST /staff
Description: Adds a new staff member.

JSON Body example:
```json
{
name: 'John Doe',
joinedDate: '2020-01-01',
baseSalary: 1000,
type: 'manager',
}
```


### Update Staff Member

Endpoint: PUT /staff/:id
Description: Updates existing staff member.

JSON Body example:
```json
{
name: 'John Doe',
type: 'sales',
}
```


### Delete Staff Member

Endpoint: DELETE /staff/:id
Description: Removes a staff member from the system.



### List All Staff Members

Endpoint: GET /staff
Description: Retrieves a list of all staff members.

### List Subordinates

Endpoint: GET /staff/:id/subordinates
Description: Retrieves a list of all subordinates for a given staff member.




- Author - Ivan Zapototsky

