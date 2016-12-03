const Promise = require('bluebird');

module.exports = function (app, addon) {
  const jira = require('../lib/jira-connector')(addon);
  const bc = require('./../lib/bitbucket-connector');

  app.get("/scenarios", addon.authenticate(), function (req, res) {
    Promise.join(
      jira.loadSettings(req, req.query.project),
      jira.getIssueInfo(req, req.query.issue),
      function (settings, issue) {
        const rev = issue.rev || 'master';
        if (!issue.file)
          return res.render('no-scenario');

        const bitbucket = bc('linkyard', 'dynamic-processes', {
          username: settings.user,
          password: settings.password
        });
        bitbucket.getFile(issue.file, rev).then(function (data) {
          res.render('scenarios', {
            name: data.file,
            rev: rev,
            shortRev: rev.substr(0, 8),
            notFixedRev: rev.match(/^[0-9a-fA-F]{4,40}$/) == null,
            content: data.raw,
            formatted: data.formatted
          });
        }, function (err) {
          console.info(err);
          res.render('scenarios-not-found', {
            message: err,
            name: issue.file,
            rev: rev
          });
        });
      });
  });
};
