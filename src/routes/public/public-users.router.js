var express = require('express');
var router = express.Router();

const HttpStatus = require('http-status-codes/index');

const publicUserService = require('./public-users.service');

const UserDataService = require('../users/user-data.service');

const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 *  Returns the with query text
 */
router.get('/:userId/top-public-tags', async (request, response) => {
  const usedPublicTags = await UserDataService.getUsedTagsForPublicBookmarks(request.params.userId);
  const topUsedPublicTags = usedPublicTags.slice(0, request.query.limit || 10);

  return response.status(HttpStatus.OK).json(topUsedPublicTags);
});


module.exports = router;
