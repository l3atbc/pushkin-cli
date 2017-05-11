function switchMessage(name, thing) {
  switch (thing) {
    case 'controller': {
      return 'are you sure you wish to delete ' + name + ' ' + thing + ' ?';
    }
    case 'model': {
      return (
        'this will also delete the migrations for this model which could cause error when running migrations, are you sure you want to delete ' +
        name +
        ' ' +
        thing +
        ' ?'
      );
    }
    default:
      null;
  }
}
const deleteQuestionPrompt = (name, thing) => {
  return [
    {
      type: 'confirm',
      name: 'confirmation',
      message: switchMessage(name, thing)
    }
  ];
};

module.exports = deleteQuestionPrompt;
