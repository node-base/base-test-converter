'use strict';

require('mocha');
var should = require('should');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var Stream = require('stream');
var es = require('event-stream');
var support = require('./support');
var App = support.resolve();
var View = App.View;
var view;

describe('View', function() {
  describe('instance', function() {
    it('should create an instance of View:', function() {
      view = new View();
      assert(view instanceof View);
    });
  });

  describe('static methods', function() {
    it('should expose `extend`:', function() {
      assert.equal(typeof View.extend, 'function');
    });
  });

  describe('prototype methods', function() {
    beforeEach(function() {
      view = new View();
    });

    it('should expose `set`:', function() {
      assert.equal(typeof view.set, 'function');
    });
    it('should expose `get`:', function() {
      assert.equal(typeof view.get, 'function');
    });
    it('should expose `del`:', function() {
      assert.equal(typeof view.del, 'function');
    });
    it('should expose `define`:', function() {
      assert.equal(typeof view.define, 'function');
    });
    it('should expose `visit`:', function() {
      assert.equal(typeof view.visit, 'function');
    });
    it('should expose `compile`:', function() {
      assert.equal(typeof view.compile, 'function');
    });
    it('should expose `render`:', function() {
      assert.equal(typeof view.render, 'function');
    });
    it('should expose `isType`:', function() {
      assert.equal(typeof view.isType, 'function');
    });
  });

  describe('properties', function() {
    it('should expose an `options` property', function() {
      view = new View({});
      assert.deepEqual(view.options, {});
      assert(view.hasOwnProperty('options'));
    });

    it('should add `options` when passed on the constructor', function() {
      view = new View({options: {foo: 'bar'}});
      assert.equal(view.options.foo, 'bar');
    });

    it('should expose a `data` property', function() {
      view = new View({app: {}});
      assert.deepEqual(view.data, {});
      assert(view.hasOwnProperty('data'));
    });

    it('should add `data` when passed on the constructor', function() {
      view = new View({data: {foo: 'bar'}});
      assert.equal(view.data.foo, 'bar');
    });

    it('should add `locals` when passed on the constructor', function() {
      view = new View({locals: {foo: 'bar'}});
      assert.equal(view.locals.foo, 'bar');
    });
  });

  describe('set', function() {
    it('should set properties on the object', function() {
      view = new View();
      view.set('foo', 'bar');
      assert.equal(view.foo, 'bar');
    });
  });

  describe('get', function() {
    it('should get properties from the object', function() {
      view = new View();
      view.set('foo', 'bar');
      assert.equal(view.get('foo'), 'bar');
    });
  });

  describe('cwd', function() {
    it('should get properties from the object', function() {
      view = new View({cwd: 'test/fixtures'});
      assert.equal(view.cwd, 'test/fixtures');
    });
  });

  describe('clone', function() {
    it('should clone the view:', function() {
      view = new View({content: 'foo'});
      view.set({path: 'foo/bar'});
      view.set('options.one', 'two');
      var clone = view.clone();
      assert(clone.contents);
      clone.set('baz', 'quux');
      clone.set('options.three', 'four');
      assert.equal(clone.get('foo'), view.get('foo'));
      assert.equal(clone.get('baz'), 'quux');
      assert.equal(typeof view.get('baz'), 'undefined');
      // not deep cloned
      assert.equal(clone.get('options.three'), 'four');
      assert.equal(view.get('options.three'), 'four');
    });

    it('should deep clone the entire object', function() {
      view = new View({content: 'foo'});
      view.set({path: 'foo/bar'});
      view.set('options.one', 'two');
      var clone = view.clone({deep: true});
      clone.set('options.three', 'four');
      assert.equal(view.get('options.one'), 'two');
      assert.equal(clone.get('options.one'), 'two');
      assert.equal(clone.get('options.three'), 'four');
      assert.equal(typeof view.get('options.three'), 'undefined');
    });
  });

  describe('visit', function() {
    it('should visit all properties on an object and call the specified method', function() {
      view = new View();
      var obj = {
        foo: 'bar',
        bar: 'baz',
        baz: 'bang'
      };
      view.visit('set', obj);
      assert.equal(view.get('foo'), 'bar');
      assert.equal(view.get('bar'), 'baz');
      assert.equal(view.get('baz'), 'bang');
    });

    it('should visit all properties on all objects in an array and call the specified method', function() {
      view = new View();
      var arr = [{foo: 'bar', bar: 'baz', baz: 'bang'}];
      view.visit('set', arr);
      assert.equal(view.get('foo'), 'bar');
      assert.equal(view.get('bar'), 'baz');
      assert.equal(view.get('baz'), 'bang');
    });
  });

  describe('compile', function() {
    it('should get view.layout from view.data.layout', function() {
      view = new View({path: 'foo', contents: 'a b c', data: {layout: 'default'}});
      assert.equal(view.layout, 'default');
    });
    it('should get view.layout from view.options.layout', function() {
      view = new View({path: 'foo', contents: 'a b c', options: {layout: 'default'}});
      assert.equal(view.layout, 'default');
    });
    it('should get view.layout from view.locals.layout', function() {
      view = new View({path: 'foo', contents: 'a b c', locals: {layout: 'default'}});
      assert.equal(view.layout, 'default');
    });
    it('should get view.layout from the view', function() {
      view = new View({path: 'foo', contents: 'a b c', layout: 'default'});
      assert.equal(view.layout, 'default');
    });

    it('should add a compiled function to `view.fn`', function() {
      view = new View({path: 'foo', contents: 'a <%= name %> z'});
      view.compile();
      assert.equal(typeof view.fn, 'function');
    });

    it('should render a compiled template', function(cb) {
      view = new View({path: 'foo', contents: 'a <%= name %> z'});
      view.compile();
      view.render({name: 'Halle'}, function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'a Halle z');
        cb();
      });
    });

    it('should render `fn` using data passed on the constructor', function(cb) {
      view = new View({
        path: 'foo',
        contents: 'a <%= name %> z',
        data: {
          name: 'Brooke'
        }
      });

      view.compile();
      view.render(function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'a Brooke z');
        cb();
      });
    });
  });

  describe('render', function() {
    it('should render a template', function(cb) {
      view = new View({path: 'foo', contents: 'a <%= name %> z'});
      view.render({name: 'Halle'}, function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'a Halle z');
        cb();
      });
    });

    it('should render fn using data passed on the constructor', function(cb) {
      view = new View({
        path: 'foo',
        contents: 'a <%= name %> z',
        data: {
          name: 'Brooke'
        }
      });

      view.render(function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'a Brooke z');
        cb();
      });
    });

    it('should pass errors in the callback.', function(cb) {
      view = new View({
        path: 'foo',
        contents: 'a <%= name %> z'
      });

      view.render(function(err) {
        assert.equal(err.message, 'name is not defined');
        cb();
      });
    });
  });
});

/**
 * The following unit tests are from Vinyl
 * Since we inherit vinyl in View, we need
 * to ensure that these still pass.
 */

describe('View', function() {
  describe('isVinyl()', function() {
    it('should return true on a vinyl object', function(cb) {
      var view = new View();
      assert.equal(View.isVinyl(view), true);
      cb();
    });
    it('should return false on a normal object', function(cb) {
      assert.equal(View.isVinyl({}), false);
      cb();
    });
    it('should return false on a null object', function(cb) {
      assert.equal(View.isVinyl({}), false);
      cb();
    });
  });

  describe('constructor()', function() {
    it('should default cwd to process.cwd', function(cb) {
      var view = new View();
      view.cwd.should.equal(process.cwd());
      cb();
    });

    it('should default base to cwd', function(cb) {
      var cwd = '/';
      var view = new View({cwd: cwd});
      view.base.should.equal(cwd);
      cb();
    });

    it('should default base to cwd even when none is given', function(cb) {
      var view = new View();
      view.base.should.equal(process.cwd());
      cb();
    });

    it('should default path to null', function(cb) {
      var view = new View();
      should.not.exist(view.path);
      cb();
    });

    it('should default history to []', function(cb) {
      var view = new View();
      view.history.should.eql([]);
      cb();
    });

    it('should default stat to null', function(cb) {
      var view = new View();
      should.not.exist(view.stat);
      cb();
    });

    it('should default contents to null', function(cb) {
      var view = new View();
      should.not.exist(view.contents);
      cb();
    });

    it('should set base to given value', function(cb) {
      var val = '/';
      var view = new View({base: val});
      view.base.should.equal(val);
      cb();
    });

    it('should set cwd to given value', function(cb) {
      var val = '/';
      var view = new View({cwd: val});
      view.cwd.should.equal(val);
      cb();
    });

    it('should set path to given value', function(cb) {
      var val = '/test.coffee';
      var view = new View({path: val});
      view.path.should.equal(val);
      view.history.should.eql([val]);
      cb();
    });

    it('should set history to given value', function(cb) {
      var val = '/test.coffee';
      var view = new View({history: [val]});
      view.path.should.equal(val);
      view.history.should.eql([val]);
      cb();
    });

    it('should set stat to given value', function(cb) {
      var val = {};
      var view = new View({stat: val});
      view.stat.should.equal(val);
      cb();
    });

    it('should set contents to given value', function(cb) {
      var val = new Buffer('test');
      var view = new View({contents: val});
      view.contents.should.equal(val);
      cb();
    });
  });

  describe('isBuffer()', function() {
    it('should return true when the contents are a Buffer', function(cb) {
      var val = new Buffer('test');
      var view = new View({contents: val});
      view.isBuffer().should.equal(true);
      cb();
    });

    it('should return false when the contents are a Stream', function(cb) {
      var val = new Stream();
      var view = new View({contents: val});
      assert(!view.isBuffer());
      cb();
    });

    it('should return false when the contents are a null', function(cb) {
      var view = new View({contents: null});
      assert(!view.isBuffer());
      cb();
    });
  });

  describe('isStream()', function() {
    it('should return false when the contents are a Buffer', function(cb) {
      var val = new Buffer('test');
      var view = new View({contents: val});
      assert(!view.isStream());
      cb();
    });

    it('should return true when the contents are a Stream', function(cb) {
      var val = new Stream();
      var view = new View({contents: val});
      view.isStream().should.equal(true);
      cb();
    });

    it('should return false when the contents are a null', function(cb) {
      var view = new View({contents: null});
      assert(!view.isStream());
      cb();
    });
  });

  describe('isNull()', function() {
    it('should return false when the contents are a Buffer', function(cb) {
      var val = new Buffer('test');
      var view = new View({contents: val});
      assert(!view.isNull());
      cb();
    });

    it('should return false when the contents are a Stream', function(cb) {
      var val = new Stream();
      var view = new View({contents: val});
      assert(!view.isNull());
      cb();
    });

    it('should return true when the contents are a null', function(cb) {
      var view = new View({contents: null});
      view.isNull().should.equal(true);
      cb();
    });
  });

  describe('isDirectory()', function() {
    var fakeStat = {
      isDirectory: function() {
        return true;
      }
    };

    it('should return false when the contents are a Buffer', function(cb) {
      var val = new Buffer('test');
      var view = new View({contents: val, stat: fakeStat});
      assert(!view.isDirectory());
      cb();
    });

    it('should return false when the contents are a Stream', function(cb) {
      var val = new Stream();
      var view = new View({contents: val, stat: fakeStat});
      assert(!view.isDirectory());
      cb();
    });

    it('should return true when the contents are a null', function(cb) {
      var view = new View({contents: null, stat: fakeStat});
      view.isDirectory().should.equal(true);
      cb();
    });
  });

  describe('clone()', function() {
    it('should copy all attributes over with Buffer', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test')
      };
      var view = new View(options);
      var view2 = view.clone();

      view2.should.not.equal(view, 'refs should be different');
      view2.cwd.should.equal(view.cwd);
      view2.base.should.equal(view.base);
      view2.path.should.equal(view.path);
      view2.contents.should.not.equal(view.contents, 'buffer ref should be different');
      view2.contents.toString('utf8').should.equal(view.contents.toString('utf8'));
      cb();
    });

    it('should copy buffer\'s reference with option contents: false', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test')
      };

      var view = new View(options);

      var copy1 = view.clone({ contents: false });
      copy1.contents.should.equal(view.contents);

      var copy2 = view.clone({});
      copy2.contents.should.not.equal(view.contents);

      var copy3 = view.clone({ contents: 'any string' });
      copy3.contents.should.not.equal(view.contents);

      cb();
    });

    it('should copy all attributes over with Stream', function(cb) {
      var stream = new Stream.PassThrough();
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: stream
      };

      var view = new View(options);
      var view2 = view.clone();

      stream.write(new Buffer('wa'));

      process.nextTick(function() {
        stream.write(new Buffer('dup'));
        stream.end();
      });

      view2.should.not.equal(view, 'refs should be different');
      view2.cwd.should.equal(view.cwd);
      view2.base.should.equal(view.base);
      view2.path.should.equal(view.path);
      view2.contents.should.not.equal(view.contents, 'stream ref should not be the same');
      view.contents.pipe(es.wait(function(err, data) {
        if (err) return cb(err);

        view2.contents.pipe(es.wait(function(err, data2) {
          if (err) return cb(err);

          data2.should.not.equal(data, 'stream contents ref should not be the same');
          data2.should.eql(data, 'stream contents should be the same');
        }));
      }));

      stream.on('end', cb);
    });

    it('should copy all attributes over with null', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };
      var view = new View(options);
      var view2 = view.clone();

      view2.should.not.equal(view, 'refs should be different');
      view2.cwd.should.equal(view.cwd);
      view2.base.should.equal(view.base);
      view2.path.should.equal(view.path);
      should.not.exist(view2.contents);
      cb();
    });

    it('should properly clone the `stat` property', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
        stat: fs.statSync(__filename)
      };

      var view = new View(options);
      var copy = view.clone();

      assert(copy.stat.isFile());
      assert(!copy.stat.isDirectory());
      assert(copy.stat instanceof fs.Stats);

      assert(view.stat.hasOwnProperty('birthtime'));
      assert(copy.stat.hasOwnProperty('birthtime'));
      assert.deepEqual(view.stat, copy.stat);
      cb();
    });

    it('should properly clone the `history` property', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: new Buffer('test'),
        stat: fs.statSync(__filename)
      };

      var view = new View(options);
      var copy = view.clone();

      copy.history[0].should.equal(options.path);
      copy.path = 'lol';
      view.path.should.not.equal(copy.path);
      cb();
    });

    it('should copy custom properties', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };

      var view = new View(options);
      view.custom = { a: 'custom property' };
      var view2 = view.clone();

      view2.should.not.equal(view, 'refs should be different');
      view2.cwd.should.equal(view.cwd);
      view2.base.should.equal(view.base);
      view2.path.should.equal(view.path);
      view2.custom.should.equal(view.custom);
      view2.custom.a.should.equal(view.custom.a);

      cb();
    });

    it('should copy history', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };

      var view = new View(options);
      view.path = '/test/test.js';
      view.path = '/test/test-938di2s.js';
      var view2 = view.clone();

      view2.history.should.eql([
        '/test/test.coffee',
        '/test/test.js',
        '/test/test-938di2s.js'
      ]);
      view2.history.should.not.equal([
        '/test/test.coffee',
        '/test/test.js',
        '/test/test-938di2s.js'
      ]);
      view2.path.should.eql('/test/test-938di2s.js');

      cb();
    });

    it('should copy all attributes deeply', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };

      var view = new View(options);
      view.custom = { a: 'custom property' };

      var view2 = view.clone(true);
      view2.custom.should.eql(view.custom);
      view2.custom.should.not.equal(view.custom);
      view2.custom.a.should.equal(view.custom.a);

      var view3 = view.clone({ deep: true });
      view3.custom.should.eql(view.custom);
      view3.custom.should.not.equal(view.custom);
      view3.custom.a.should.equal(view.custom.a);

      var view4 = view.clone(false);
      view4.custom.should.eql(view.custom);
      view4.custom.should.equal(view.custom);
      view4.custom.a.should.equal(view.custom.a);

      var view5 = view.clone({ deep: false });
      view5.custom.should.eql(view.custom);
      view5.custom.should.equal(view.custom);
      view5.custom.a.should.equal(view.custom.a);

      cb();
    });
  });

  describe('pipe()', function() {
    it('should write to stream with Buffer', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test')
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(options.contents.toString('utf8'));
      });
      stream.on('end', function() {
        cb();
      });
      var ret = view.pipe(stream);
      ret.should.equal(stream, 'should return the stream');
    });

    it('should pipe to stream with Stream', function(cb) {
      var testChunk = new Buffer('test');
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(testChunk.toString('utf8'));
        cb();
      });
      var ret = view.pipe(stream);
      ret.should.equal(stream, 'should return the stream');

      view.contents.write(testChunk);
    });

    it('should do nothing with null', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function() {
        throw new Error('should not write');
      });
      stream.on('end', function() {
        cb();
      });
      var ret = view.pipe(stream);
      ret.should.equal(stream, 'should return the stream');
    });

    it('should write to stream with Buffer', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Buffer('test')
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(options.contents.toString('utf8'));
        cb();
      });
      stream.on('end', function() {
        throw new Error('should not end');
      });
      var ret = view.pipe(stream, {end: false});
      ret.should.equal(stream, 'should return the stream');
    });

    it('should pipe to stream with Stream', function(cb) {
      var testChunk = new Buffer('test');
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function(chunk) {
        should.exist(chunk);
        (chunk instanceof Buffer).should.equal(true, 'should write as a buffer');
        chunk.toString('utf8').should.equal(testChunk.toString('utf8'));
        cb();
      });
      stream.on('end', function() {
        throw new Error('should not end');
      });
      var ret = view.pipe(stream, {end: false});
      ret.should.equal(stream, 'should return the stream');

      view.contents.write(testChunk);
    });

    it('should do nothing with null', function(cb) {
      var options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };
      var view = new View(options);
      var stream = new Stream.PassThrough();
      stream.on('data', function() {
        throw new Error('should not write');
      });
      stream.on('end', function() {
        throw new Error('should not end');
      });
      var ret = view.pipe(stream, {end: false});
      ret.should.equal(stream, 'should return the stream');
      process.nextTick(cb);
    });
  });

  describe('inspect()', function() {
    it('should return correct format when no contents and no path', function(cb) {
      var view = new View();
      view.inspect().should.equal('<View >');
      cb();
    });

    it('should return correct format when Buffer and no path', function(cb) {
      var val = new Buffer('test');
      var view = new View({
        contents: val
      });
      view.inspect().should.equal('<View <Buffer 74 65 73 74>>');
      cb();
    });

    it('should return correct format when Buffer and relative path', function(cb) {
      var val = new Buffer('test');
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val
      });
      view.inspect().should.equal('<View "test.coffee" <Buffer 74 65 73 74>>');
      cb();
    });

    it('should return correct format when Buffer and only path and no base', function(cb) {
      var val = new Buffer('test');
      var view = new View({
        cwd: '/',
        path: '/test/test.coffee',
        contents: val
      });
      delete view.base;
      view.inspect().should.equal('<View "/test/test.coffee" <Buffer 74 65 73 74>>');
      cb();
    });

    it('should return correct format when Stream and relative path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      });
      view.inspect().should.equal('<View "test.coffee" <PassThroughStream>>');
      cb();
    });

    it('should return correct format when null and relative path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      });
      view.inspect().should.equal('<View "test.coffee">');
      cb();
    });
  });

  describe('contents get/set', function() {
    it('should work with Buffer', function(cb) {
      var val = new Buffer('test');
      var view = new View();
      view.contents = val;
      view.contents.should.equal(val);
      cb();
    });

    it('should work with Stream', function(cb) {
      var val = new Stream.PassThrough();
      var view = new View();
      view.contents = val;
      view.contents.should.equal(val);
      cb();
    });

    it('should work with null', function(cb) {
      var val = null;
      var view = new View();
      view.contents = val;
      assert.equal(view.contents, null);
      cb();
    });

    it('should work with string', function(cb) {
      var val = 'test';
      var view = new View();
      view.contents = val;
      assert.deepEqual(view.contents, new Buffer(val));
      cb();
    });
  });

  describe('relative get/set', function() {
    it('should error on set', function(cb) {
      var view = new View();
      try {
        view.relative = 'test';
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should error on get when no base', function(cb) {
      var view = new View();
      delete view.base;
      try {
        view.relative;
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should error on get when no path', function(cb) {
      var view = new View();
      try {
        view.relative;
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should return a relative path from base', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.relative.should.equal('test.coffee');
      cb();
    });

    it('should return a relative path from cwd', function(cb) {
      var view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });
      view.relative.should.equal(path.join('test', 'test.coffee'));
      cb();
    });
  });

  describe('dirname get/set', function() {
    it('should error on get when no path', function(cb) {
      var view = new View();
      try {
        view.dirname;
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should return the dirname of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.dirname.should.equal('/test');
      cb();
    });

    it('should error on set when no path', function(cb) {
      var view = new View();
      try {
        view.dirname = '/test';
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should set the dirname of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.dirname = '/test/foo';
      view.path.should.equal('/test/foo/test.coffee');
      cb();
    });
  });

  describe('basename get/set', function() {
    it('should error on get when no path', function(cb) {
      var view = new View();
      try {
        view.basename;
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should return the basename of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.basename.should.equal('test.coffee');
      cb();
    });

    it('should error on set when no path', function(cb) {
      var view = new View();
      try {
        view.basename = 'test.coffee';
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should set the basename of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.basename = 'foo.png';
      view.path.should.equal('/test/foo.png');
      cb();
    });
  });

  describe('extname get/set', function() {
    it('should error on get when no path', function(cb) {
      var view = new View();
      try {
        view.extname;
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should return the extname of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.extname.should.equal('.coffee');
      cb();
    });

    it('should error on set when no path', function(cb) {
      var view = new View();
      try {
        view.extname = '.coffee';
      } catch (err) {
        should.exist(err);
        cb();
      }
    });

    it('should set the extname of the path', function(cb) {
      var view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.extname = '.png';
      view.path.should.equal('/test/test.png');
      cb();
    });
  });

  describe('path get/set', function() {
    it('should record history when instantiation', function() {
      var view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      view.path.should.eql('/test/test.coffee');
      view.history.should.eql(['/test/test.coffee']);
    });

    it('should record history when path change', function() {
      var view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      view.path = '/test/test.js';
      view.path.should.eql('/test/test.js');
      view.history.should.eql(['/test/test.coffee', '/test/test.js']);

      view.path = '/test/test.coffee';
      view.path.should.eql('/test/test.coffee');
      view.history.should.eql(['/test/test.coffee', '/test/test.js', '/test/test.coffee']);
    });

    it('should not record history when set the same path', function() {
      var view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      view.path = '/test/test.coffee';
      view.path = '/test/test.coffee';
      view.path.should.eql('/test/test.coffee');
      view.history.should.eql(['/test/test.coffee']);

      // ignore when set empty string
      view.path = '';
      view.path.should.eql('/test/test.coffee');
      view.history.should.eql(['/test/test.coffee']);
    });

    it('should throw when set path null in constructor', function() {
      (function() {
        view = new View({
          cwd: '/',
          path: null
        });
      }).should.throw('path should be string');
    });

    it('should throw when set path null', function() {
      view = new View({
        cwd: '/',
        path: 'foo'
      });

      (function() {
        view.path = null;
      }).should.throw('path should be string');
    });
  });
});
