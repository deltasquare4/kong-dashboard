var HomePage = require('../util/HomePage');
var Sidebar = require('../util/Sidebar');
var ListServicesPage = require('../util/ListServicesPage');
var CreatePage = require('../util/CreatePage');
var KongDashboard = require('../util/KongDashboard');
var Kong = require('../util/KongClient');
var request = require('../../lib/request');
var using = require('jasmine-data-provider');
var PropertyInput = require('../util/PropertyInput');

var kd = new KongDashboard();

describe('Service creation testing', () => {

  var serviceSchema;

  beforeEach((done) => {
    Kong.deleteAllServices().then(done);
  });

  afterEach(() => {
    browser.refresh();
  });

  beforeAll((done) => {
    kd.start({'--kong-url': 'http://127.0.0.1:8001'}, () => {
      HomePage.visit();
      Sidebar.clickOn('Services');
      ListServicesPage.clickAddButton();
      request.get('http://127.0.0.1:8081/config').then((response) => {
        eval(response.body);
        serviceSchema = __env.schemas.service;
        done();
      });
    });
  });

  afterAll((done) => {
    kd.stop(done);
  });

  it('should recognize and display an input for every field', () => {
    expect(browser.getCurrentUrl()).toEqual('http://localhost:8081/#!/services/add');
    Object.keys(serviceSchema.properties).forEach((fieldName) => {
      expect(PropertyInput.getElement(fieldName).isPresent()).toBeTruthy('Form section for ' + fieldName + ' is missing');
    })
  });

  using(validServiceInputsProvider, (data) => {
    it('should correctly create an Service', (done) => {
      Object.keys(data.inputs).forEach((inputName) => {
        PropertyInput.set(inputName, data.inputs[inputName]);
      });
      CreatePage.submit().then(() => {
        expect(element(by.cssContainingText('div.toast', 'Service created')).isPresent()).toBeTruthy();
        return browser.waitForAngular(); // waiting for ajax call to create Service to be finished.
      }).then(() => {
        return Kong.getFirstService();
      }).then((service) => {
        delete service.created_at;
        delete service.updated_at;
        delete service.id;
        expect(service).toEqual(data.expectedCreatedService);
        done();
      });
    })
  });

  using(invalidServiceInputsProvider, (data) => {
    it('should correctly show validation error on Service creation', (done) => {
      Object.keys(data.inputs).forEach((inputName) => {
        PropertyInput.set(inputName, data.inputs[inputName]);
      });
      CreatePage.submit().then(() => {
        expect(element(by.cssContainingText('div.toast', 'Service created')).isPresent()).toBeFalsy();
        if (data.expectedErrors.globalError) {
          expect(element(by.cssContainingText('div.toast', data.expectedErrors.globalError)).isPresent()).toBeTruthy();
        }
        if (data.expectedErrors.properties) {
          Object.keys(serviceSchema.properties).forEach((fieldName) => {
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

  function validServiceInputsProvider() {
    if (process.env.KONG_VERSION === '0.13') {
      return [
        {
          inputs: {
            name: 'my_awesome_Service',
            url: 'http://upstream.loc'
          },
          expectedCreatedService: {
            name: 'my_awesome_Service',
            protocol: 'http',
            host: 'upstream.loc',
            port: 80,
            path: null,
            retries: 5,
            connect_timeout: 60000,
            write_timeout: 60000,
            read_timeout: 60000
          }
        }
      ];
    }

    throw new Error('Kong version not supported in unit tests.')
  }

  function invalidServiceInputsProvider() {
    if (process.env.KONG_VERSION === '0.13') {
      return [
        {
          inputs: {},
          expectedErrors: {'properties': ['name']}
        }
      ];
    }
    throw new Error('Kong version not supported in unit tests.')
  }
});
