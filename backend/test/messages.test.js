const express = require('express');
const request = require('supertest');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { expect } = require('chai');

describe('Messages routes (unit tests with stubs)', function() {
  let app;
  let MessageStub;
  let UserStub;
  let authStub;
  let adminAuthStub;

  beforeEach(() => {
    // Stubs
    authStub = (req, res, next) => {
      req.user = { id: 'user1', isAdmin: false };
      next();
    };
    adminAuthStub = (req, res, next) => next();

    // Message stub with chainable populate/sort
    MessageStub = {
      find: sinon.stub(),
      findById: sinon.stub()
    };

    UserStub = {
      findById: sinon.stub()
    };

    // Proxyquire the messages router and inject stubs
    const messagesRouter = proxyquire('../routes/messages', {
      '../models/Message': MessageStub,
      '../models/User': UserStub,
      '../middleware/auth': { auth: authStub, adminAuth: adminAuthStub },
      'mongoose': { Types: { ObjectId: { isValid: () => true } } }
    });

    app = express();
    app.use(express.json());
    app.use('/messages', messagesRouter);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('GET /messages/with/:otherId should return conversation messages', async () => {
    const fakeMessages = [
      {
        _id: 'm1',
        senderId: { _id: 'user1', name: 'Alice', email: 'a@example.com' },
        receiverId: { _id: 'user2', name: 'Bob', email: 'b@example.com' },
        content: 'Hello',
        isDeleted: false,
        createdAt: new Date().toISOString()
      }
    ];

    // make find return an object with populate and sort that resolves to fakeMessages
    MessageStub.find.returns({
      populate() { return this; },
      sort() { return Promise.resolve(fakeMessages); }
    });

    const res = await request(app).get('/messages/with/user2');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body[0]).to.have.property('content', 'Hello');
  });

  it('DELETE /messages/:id should unsend when sender and within time limit', async () => {
    // Fake message returned by findById
    const messageObj = {
      _id: 'm1',
      senderId: 'user1',
      receiverId: 'user2',
      content: 'Hi',
      createdAt: new Date(),
      save: sinon.stub().resolves()
    };

    MessageStub.findById.resolves(messageObj);

    const res = await request(app).delete('/messages/m1');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Message unsent successfully');
    // ensure save called and isDeleted set
    expect(messageObj.save.calledOnce).to.be.true;
    expect(messageObj.isDeleted).to.equal(true);
  });

  it('DELETE /messages/:id should return 403 if not sender', async () => {
    const messageObj = {
      _id: 'm2',
      senderId: 'someoneElse',
      receiverId: 'user1',
      content: 'Hi',
      createdAt: new Date(),
      save: sinon.stub().resolves()
    };

    MessageStub.findById.resolves(messageObj);

    const res = await request(app).delete('/messages/m2');
    expect(res.status).to.equal(403);
  });
});
