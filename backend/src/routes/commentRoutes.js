const express = require('express');
const requireCreator = require('../middleware/auth');
const { requireViewerOrCreator, optionalViewerOrCreator } = require('../middleware/auth');
const controller = require('../controllers/commentController');

const router = express.Router();

router.post('/', requireViewerOrCreator, controller.createComment);
router.post('/:id/replies', requireViewerOrCreator, controller.createReply);
router.post('/:id/like', requireViewerOrCreator, controller.toggleCommentLike);
router.get('/manage/all', requireCreator, controller.listAllComments);
router.get('/recent', controller.listRecentComments);
router.get('/:contentId', optionalViewerOrCreator, controller.listComments);
router.patch('/:id', requireCreator, controller.moderateComment);
router.delete('/:id', requireCreator, controller.moderateComment);

module.exports = router;
