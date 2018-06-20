var HomePage = require('../util/HomePage');
var Sidebar = require('../util/Sidebar');
var ListRoutesPage = require('../util/ListRoutesPage');
var CreatePage = require('../util/CreatePage');
var KongDashboard = require('../util/KongDashboard');
var Kong = require('../util/KongClient');
var request = require('../../lib/request');
var using = require('jasmine-data-provider');
var PropertyInput = require('../util/PropertyInput');

var kd = new KongDashboard();

describe('Route creation testing', () => {

  var RouteSchema;

  if (process.env.KONG_VERSION === '0.13') {
    // no Service before Kong 0.13.
    return
  }

  beforeEach((done) => {
    Kong.deleteAllRoutes().then(done);
  });

  afterEach(() => {
    browser.refresh();
  });

  beforeAll((done) => {
    kd.start({'--kong-url': 'http://127.0.0.1:8001'}, () => {
      HomePage.visit();
      Sidebar.clickOn('Routes');
      ListRoutesPage.clickAddButton();
      request.get('http://127.0.0.1:8081/config').then((response) => {
        eval(response.body);
        RouteSchema = __env.schemas.route;
        done();
      });
    });
  });

  afterAll((done) => {
    kd.stop(done);
  });

  it('should recognize and display an input for every field', () => {
    expect(browser.getCurrentUrl()).toEqual('http://localhost:8081/#!/routes/add');
    Object.keys(RouteSchema.properties).forEach((fieldName) => {
      expect(PropertyInput.getElement(fieldName).isPresent()).toBeTruthy('Form section for ' + fieldName + ' is missing');
    })
  });

  using(validRouteInputsProvider, (data) => {
    it('should correctly create Route', (done) => {
      Object.keys(data.inputs).forEach((inputName) => {
        PropertyInput.set(inputName, data.inputs[inputName]);
      });
      CreatePage.submit().then(() => {
        expect(element(by.cssContainingText('div.toast', 'Route created')).isPresent()).toBeTruthy();
        return browser.waitForAngular(); // waiting for ajax call to create Route to be finished.
      }).then(() => {
        return Kong.getFirstRoute();
      }).then((route) => {
        delete route.created_at;
        delete route.updated_at;
        delete route.id;
        expect(route).toEqual(data.expectedCreatedRoute);
        done();
      });
    })
  });

  using(invalidRouteInputsProvider, (data) => {
    it('should correctly show validation error on Route creation', (done) => {
      Object.keys(data.inputs).forEach((inputName) => {
        PropertyInput.set(inputName, data.inputs[inputName]);
      });
      CreatePage.submit().then(() => {
        expect(element(by.cssContainingText('div.toast', 'Route created')).isPresent()).toBeFalsy();
        if (data.expectedErrors.globalError) {
          expect(element(by.cssContainingText('div.toast', data.expectedErrors.globalError)).isPresent()).toBeTruthy();
        }
        if (data.expectedErrors.properties) {
          Object.keys(RouteSchema.properties).forEach((fieldName) => {
            var expectHasErrorMessage = expect(PropertyInput.getElementErrorMsg(fieldName).isPresent());
            if (data.expectedErrors.properties.indexOf(fieldName) !== -1) {
              expectHasErrorMessage.toBeTruthy(fieldName + ' should have an error message.');
            } else {
              expectHasErrorMessage.toBeFalsy(fieldName + ' should not have an error message.');
            }
          });
        }
        done();
      });
    })
  });

  function validRouteInputsProvider() {
    if (process.env.KONG_VERSION === '0.13') {
      return [
        {
          inputs: {
            protocols: 'http',
            methods: 'GET',
            hosts: 'test-node.com',
            paths: '/testNode',
            strip_path: true,
            preserve_host: false,
            service: 'testService'
          },
          expectedCreatedRoute: {
            protocols: 'http',
            methods: 'GET',
            hosts: 'test-node.com',
            paths: '/testNode',
            strip_path: true,
            preserve_host: false,
            service: {id: 'testService'}
          }
        }
      ];
    }

    throw new Error('Kong version not supported in unit tests.')
  }

  function invalidRouteInputsProvider() {
    if (process.env.KONG_VERSION === '0.13') {
      return [
        {
          inputs: {},
          expectedErrors: {'properties': ['protocols']}
        }
      ];
    }
    throw new Error('Kong version not supported in unit tests.')
  }
});
