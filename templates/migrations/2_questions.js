exports.up = function(knex) {
  return knex.schema.createTable('questions', table => {
    table.increments('id').primary();
    table.string('type');
    table.string('prompt');
    table
      .integer('trialId')
      .references('id')
      .inTable('trials')
      .onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('questions');
};
