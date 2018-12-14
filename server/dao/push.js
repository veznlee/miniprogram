const $sqlQuery = require('./sqlCRUD').access; //
/* 
access = {
    queryToken: 'select token from access'
}; 
*/
const _ = require('./query');

const push = {
    getPusherToken: function() {
        return _.query($sqlQuery.queryToken);
    }
};

module.exports = push;
/*查询token*/