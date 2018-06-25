var HomePage = require('../../util/HomePage');
var Sidebar = require('../../util/Sidebar');
var PluginPage = require('../../util/PluginPage');
var ListPluginsPage = require('../../util/ListPluginsPage');
var KongDashboard = require('../../util/KongDashboard');
var Kong = require('../../util/KongClient');
var PropertyInput = require('../../util/PropertyInput');
var ObjectProperties = require('../../util/ObjectProperties');

var kd = new KongDashboard();

describe('Basic Auth plugin testing:', () => {
  var service;

  beforeAll((done) => {
    kd.start({'--kong-url': 'http://127.0.0.1:8001'}, () => {
      Kong.deleteAllServices().then(() => {
        return createService();
      }).then((res) => {
        service = res;
        done();
      });
    });
  });

  afterAll((done) => {
    kd.stop(done);
  });

  beforeEach((done) => {
    Kong.deleteAllPlugins().then(done);
  });

  it('should successfully create a basic-auth plugin for one service', (done) => {
    HomePage.visit();
    Sidebar.clickOn('Plugins');
    ListPluginsPage.clickAddButton();

    inputs = {
      'name': 'basic-auth',
      'service_id': service.name,
      'config-hide_credentials': true,
      'config-anonymous': ''
    };
    expectedPluginParams = {
      'service_id': service.id,
      'name': 'basic-auth',
      'config': {'hide_credentials': true, 'anonymous': ''},
      'enabled': true
    };

    ObjectProperties.fillAndSubmit(inputs).then(() => {
      expect(element(by.cssContainingText('div.toast', 'Plugin saved!')).isPresent()).toBeTruthy();
      return Kong.getFirstPlugin();
    }).then((createdPlugin) => {
      delete createdPlugin['id'];
      delete createdPlugin['created_at'];
      expect(createdPlugin).toEqual(expectedPluginParams);
      done();
    });
  });

  it('should be possible to edit a previously created basic-auth plugin', (done) => {
    Kong.createPlugin({
      name: 'basic-auth',
      config: {hide_credentials: false}
    }).then((createdPlugin) => {
      PluginPage.visit(createdPlugin.id);
      var inputs = {
        'config-hide_credentials': true
      };
      return ObjectProperties.fillAndSubmit(inputs);
    }).then(() => {
      expect(element(by.cssContainingText('div.toast', 'Plugin saved!')).isPresent()).toBeTruthy();
      return Kong.getFirstPlugin();
    }).then((updatedPlugin) => {
      if (process.env.KONG_VERSION === '0.9') {
        expect(updatedPlugin.config).toEqual({'hide_credentials': true});
      } else {
        expect(updatedPlugin.config).toEqual({'hide_credentials': true, 'anonymous': ''});
      }
      done();
    });
  });

  it('should be successfully create acl plugin for one service', (done) => {
    HomePage.visit();
    Sidebar.clickOn('Plugins');
    ListPluginsPage.clickAddButton();
    var inputs = {
      'name': 'acl',
      'service_id': service.name,
      'config-whitelist': ['foo']
    };
    ObjectProperties.fillAndSubmit(inputs).then(() => {
      expect(element(by.cssContainingText('div.toast', 'Plugin saved!')).isPresent()).toBeTruthy();
      return Kong.getFirstPlugin();
    }).then((createdPlugin) => {
      expect(createdPlugin.name).toEqual('acl');
      expect(createdPlugin.service_id).toEqual(service.id);
      expect(createdPlugin.config).toEqual({'whitelist': ['foo']});
      done();
    });
  });

  it('should be possible to edit a previously created acl plugin', (done) => {
    Kong.createPlugin({
      name: 'acl',
      config: {blacklist: ['foo', 'bar']}
    }).then((createdPlugin) => {
      PluginPage.visit(createdPlugin.id);
      var inputs = {
        'config-blacklist': '',
        'config-whitelist': ['admin']
      };
      return ObjectProperties.fillAndSubmit(inputs);
    }).then(() => {
      expect(element(by.cssContainingText('div.toast', 'Plugin saved!')).isPresent()).toBeTruthy();
      return Kong.getFirstPlugin();
    }).then((updatedPlugin) => {
      expect(updatedPlugin.name).toEqual('acl');
      expect(updatedPlugin.api_id).toBeUndefined();
      expect(updatedPlugin.config).toEqual({'whitelist': ['admin'], 'blacklist': {}});
      done();
    });
  });

  function createService() {
      return Kong.createService({
        name: 'my_awesome_Service',
        url: 'http://upstream.loc'
      });

    throw new Error('Kong version not supported in unit tests.')
  }
});
