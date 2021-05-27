<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p

# Nestjs Boilerplate

## Description

[Nestjs](https://github.com/nestjs/nest) boilerplate with TypeORM.

## Installation

1. Install dependencies

```bash
$ yarn install
```

2. Run postgres, redis, adminer (docker only)

```bash
$ yarn dc:up
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Migration

1. When create new entity or have change (column name, type column, ...), use command below to create file migration. TypeORM will check difference between entity in database and entity declared in file to generate query. File will be created in folder src/migrations.

```bash
$ yarn typeorm migration:generate -n [migrationName]
```

2. If you need create file migration and write query manually, run:

```bash
yarn typeorm migration:create -n [migrationName]
```

3. To run migration, run code below and TypeORM will check which migration file have not run, and make change.

```bash
$ yarn typeorm migration:run
```

## Stay in touch

- Author - [duongdt0291](https://duongdt0291.github.io)
