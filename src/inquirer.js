const deleteQuestionPrompt = name => {
  return [
    {
      type: 'confirm',
      name: 'confirmation',
      message: 'are you sure you wish to delete ' + name + '?'
    }
  ];
};

module.exports = deleteQuestionPrompt;
