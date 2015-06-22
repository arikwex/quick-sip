/* Current date-time printer */
module.exports = function() {
  var date = new Date(),
      datetime = '';
  datetime += date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' ';
  datetime += (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
  return datetime;
};