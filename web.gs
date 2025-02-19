/**
 * Webアプリのエントリーポイント
 */
function doGet() {
  // スプレッドシートを取得
  // 必要に応じてシート名やスプレッドシートIDを指定してください
  // 例: var ss = SpreadsheetApp.openById("スプレッドシートID");
  var ss = SpreadsheetApp.getActiveSpreadsheet(); 
  var sheet = ss.getActiveSheet(); // または getSheetByName("シート名");

  // データ範囲を取得（2行目から最終行まで、4列分）
  var lastRow = sheet.getLastRow();
  // 見出し行が1行目の場合、データは2行目以降と想定
  // 取得範囲: (開始行, 開始列, 行数, 列数)
  var dataRange = sheet.getRange(2, 1, lastRow - 1, 4);
  var data = dataRange.getValues();

  // テンプレートにデータを渡す
  var template = HtmlService.createTemplateFromFile("index");
  template.records = data; // テンプレート側で「records」として参照

  // テンプレートを評価して返す
  return template.evaluate()
    .setTitle("スプレッドシート情報")      // タブタイトル（任意）
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 
}

/**
 * テンプレート内で他のHTMLファイルをインクルードするためのヘルパー
 * 例: <?!= include('header'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
