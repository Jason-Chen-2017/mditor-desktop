const pdf = require('html-pdf');
const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);
const readFile = Promise.promisify(require('fs').readFile);
const path = require('path');
const stp = require('stp');
const UMLParser = require('../uml');

const Parser = require('mditor').Parser;
Parser.highlights['uml'] = new UMLParser();

const parser = Promise.promisifyAll(new Parser());

exports.toHTML = async function (opts) {
  if (!opts) return;
  opts.title = opts.title || 'Untitled';
  opts.style = opts.style || '';
  opts.content = opts.content || '';
  let styleFile = require.resolve('mditor/dist/css/mditor.min.css');
  opts.style += (await readFile(styleFile)).toString();
  if (opts.border) {
    opts.style += (await readFile(`${__dirname}/border.css`)).toString();
  }
  opts.content = await parser.parseAsync(opts.content);
  let tmpl = (await readFile(`${__dirname}/tmpl.html`)).toString();
  let fn = stp(tmpl);
  return fn(opts);
};

exports.toPDF = async function (opts) {
  let html = await this.toHTML(opts);
  return new Promise((resolve, reject) => {
    pdf.create(html, {
      format: 'A4',
      border: '1cm',
      type: 'pdf'
    }).toBuffer(function (err, buffer) {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
};

exports.toImage = async function (opts) {
  opts.style = 'body{padding:15px;background-color: #fff;}';
  let html = await this.toHTML(opts);
  return new Promise((resolve, reject) => {
    pdf.create(html, {
      border: '1cm',
      width: '900px',
      type: opts.type || 'png'
    }).toBuffer(function (err, buffer) {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
};