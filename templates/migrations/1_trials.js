exports.up = function(knex) {
  return knex.schema.createTable('trials', table => {
    table.increments('id').primary();
    table.string('name');
    table.timestamp('updated_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'))
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('trials');
};
