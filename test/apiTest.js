const supertest = require('supertest');
const agent = supertest.agent("http://localhost:5000/");
const date = new Date();
const time = date.getTime();

const example_app = {
  name: 'example_application',
  application_id: '5c32fa1eb335501910d47b24',
  repo_id: '82',
  container_id: '5c65371b1d18d2d991ca20633750eab871f52ff831c4a65226370bbc39e8c8ea',
  port: '6020'
};

const example_user = {
  username: 'test3',
  password: '00000000'
}

let app;

describe("Sign In as developer", () => {
  it("should return error (wrong credentials)", (done) => {
    agent
      .post("developers/authenticate")
      .send({username: 'random_username', password: 'random_password'})
      .expect(401)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should return home page (right credentials)", (done) => {
    agent
      .post("developers/authenticate")
      .send({username: example_user.username, password: example_user.password})
      .expect(302)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Create new application", () => {
  it("should return error (existing app name)", (done) => {
    agent
      .post("applications/test20")
      .expect(400)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should create new application", (done) => {
    agent
      .post("applications/" + time)
      .expect(200)
      .end((err,res) => {
        if (err) return done(err);
        app = res.body.app;
        done();
      });
  });
});

describe("Create development environment (container)", () => {
  it("should create development environment of app", (done) => {
    agent
      .post("applications/" + app._id + '/instantiate')
      .send({image_tag: 'ubuntu14.04_python3_node_v6'})
      .expect(201)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Stop the development's environment container (started by default)", () => {
  it("should catch the error (not an existing app)", (done) => {
    agent
      .put("containers/stop/random_container_id")
      .send({application_id: 'random_application_id'})
      .expect(412)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should stop the application's container successfuly", (done) => {
    agent
      .put("containers/stop/" + example_app.container_id)
      .send({application_id: example_app.application_id})
      .expect(201)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Start the development's environment container (previously stopped)", () => {
  it("should catch the error (not an existing app)", (done) => {
    agent
      .put("containers/start/random_container_id")
      .send({application_id: 'random_application_id'})
      .expect(412)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should start the application's container successfuly", (done) => {
    agent
      .put("containers/start/" + example_app.container_id)
      .send({application_id: example_app.application_id})
      .expect(201)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Synchronize container with the application repository", () => {
  it("should catch unauthorized error", (done) => {
    agent
      .post("repositories/synchronize")
      .send({application: {'container': example_app.container_id, 'repo_id': example_app.repo_id, '_id': example_app.application_id}, password: 'random_password'})
      .expect(412)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should synhronize successfuly", (done) => {
    agent
      .post("repositories/synchronize")
      .send({application: {'container': example_app.container_id, 'repo_id': example_app.repo_id, '_id': example_app.application_id}, password: example_user.password})
      .expect(200)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Install application's dependencies", () => {
  it("should catch error (non existing application)", (done) => {
    agent
      .put("applications/dependencies")
      .send({application: {'_id': 'some_id', 'name': 'some_name', 'container': 'some_container'}})
      .expect(500)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should install successfuly", (done) => {
    agent
      .put("applications/dependencies")
      .send({application: {'_id': example_app.application_id, 'name': example_app.name, 'container': example_app.container_id}})
      .expect(200)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Deploy application", () => {
  it("should catch error (non existing application)", (done) => {
    agent
      .put("applications/deploy")
      .send({application: {'_id': 'some_id', 'name': 'some_name', 'container': 'some_container', 'repo_id': 'some_repo_id'}})
      .expect(404)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should deploy successfuly", (done) => {
    agent
      .put("applications/deploy")
      .send({application: {'_id': example_app.application_id, 'name': example_app.name, 'container': example_app.container_id, 'repo_id': example_app.repo_id}})
      .expect(200)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});

describe("Stop application execution", () => {
  it("should catch error (non existing application)", (done) => {
    agent
      .put("applications/stop")
      .send({application: {'_id': 'some_id', 'container': 'some_container', 'repo_id': 'some_repo_id'}})
      .expect(404)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });

  it("should stop successfuly", (done) => {
    agent
      .put("applications/stop")
      .send({application: {'_id': example_app.application_id, 'container': example_app.container_id, 'repo_id': example_app.repo_id}})
      .expect(200)
      .end((err,res) => {
        if (err) return done(err);
        done();
      });
  });
});
