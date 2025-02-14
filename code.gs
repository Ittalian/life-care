const SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
const ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('ACCESS_TOKEN');
const SELF_ID = PropertiesService.getScriptProperties().getProperty('SELF_ID');
const LINE_REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';
const LINE_REPLY_SELF_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const data = json.events[0];
  const message = data.message.text;

  switch (message) {
    case '始まった':
      startEvent(data);
      break;
    case '終わった':
      endEvent(data);
      break;
    default:
  }
}

function startEvent(data) {
  const careSheet = fetchSheet();
  if (isLastRowBlank(careSheet)) {
    const text = PropertiesService.getScriptProperties().getProperty('LAST_ROW_MUST_FILL');
    const replyMessages = [
      textParams(text),
    ];
    sendMessage(data, replyMessages, LINE_REPLY_ENDPOINT);
  } else {
    const replyMessages = getStartReplyMessages();
    const selfReplyMessages = getStartSelfReplyMessages();
    try {
      sendMessage(data, replyMessages, LINE_REPLY_ENDPOINT);
      sendMessageToSelf(selfReplyMessages, LINE_REPLY_SELF_ENDPOINT);
      setStartDate(careSheet);
    } catch (e) {
      sendErrorMessage();
    }
  }
}

function endEvent(data) {
  const careSheet = fetchSheet();
  if (isLastRowFill(careSheet)) {
    const replyMessages = getEndReplyMessages();
    const selfReplyMessages = getEndSelfReplyMessages();
    try {
      sendMessage(data, replyMessages, LINE_REPLY_ENDPOINT);
      sendMessageToSelf(selfReplyMessages, LINE_REPLY_SELF_ENDPOINT);
      setEndDate(careSheet);
    } catch (e) {
      sendErrorMessage();
    }
  } else {
    const text = PropertiesService.getScriptProperties().getProperty('LAST_ROW_MUST_BLANK');
    const replyMessages = [
      textParams(text),
    ];
    sendMessage(data, replyMessages, LINE_REPLY_ENDPOINT);
  }
}

function getStartReplyMessages() {
  const firstText = PropertiesService.getScriptProperties().getProperty('START_MESSAGE_TO_MOE_FIRST');
  const secondText = PropertiesService.getScriptProperties().getProperty('START_MESSAGE_TO_MOE_SECOND');
  const imageUrl = fetchImage();
  const firstReplyMessage = textParams(firstText);
  const secondReplyMessage = textParams(secondText);
  const thirdReplyMessage = imageParams(imageUrl);

  return [
    firstReplyMessage,
    secondReplyMessage,
    thirdReplyMessage,
  ];
}

function getStartSelfReplyMessages() {
  const selfText = PropertiesService.getScriptProperties().getProperty('START_SELF_MESSAGE');
  const selfMessage = textParams(selfText);

  return [
    selfMessage,
  ];
}

function getEndReplyMessages() {
  const firstText = PropertiesService.getScriptProperties().getProperty('END_MESSAGE_TO_MOE');
  const firstReplyMessage = textParams(firstText);

  return replyMessages = [
    firstReplyMessage,
  ];
}

function getEndSelfReplyMessages() {
  const selfText = PropertiesService.getScriptProperties().getProperty('END_SELF_MESSAGE');
  const selfMessage = textParams(selfText);

  return [
    selfMessage,
  ];
}

function isLastRowBlank(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow == 0) return false;
  return sheet.getRange(lastRow, 1).isBlank() || sheet.getRange(lastRow, 2).isBlank();
}

function isLastRowFill(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow == 0) return false;
  return !sheet.getRange(lastRow, 1).isBlank() && sheet.getRange(lastRow, 2).isBlank();
}

function setStartDate(sheet) {
  const lastRow = sheet.getLastRow();
  const today = new Date();
  const dateParam = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy-MM-dd');
  sheet.getRange(lastRow + 1, 1).setValue(dateParam);
}

function setEndDate(sheet) {
  const lastRow = sheet.getLastRow();
  const today = new Date();
  const dateParam = Utilities.formatDate(today, 'Asia/Tokyo', 'yyyy-MM-dd');
  sheet.getRange(lastRow, 2).setValue(dateParam);
}

function sendMessage(data, messages, url) {
  const option = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': data.replyToken,
      'messages': messages,
    }),
  }

  UrlFetchApp.fetch(url, option);
}

function sendMessageToSelf(messages, url) {
  const option = {
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'to': SELF_ID,
      'messages': messages,
    }),
  }

  UrlFetchApp.fetch(url, option);
}

function sendErrorMessage() {
  const errorReply = textParams('ネットワークエラー');
  sendMessage(data, errorReply, LINE_REPLY_ENDPOINT);
}


function fetchSheet() {
  const spreadSheet = SpreadsheetApp.openByUrl(SHEET_URL);
  return spreadSheet.getSheets()[2];
}

function fetchImage() {
  var albumId = PropertiesService.getScriptProperties().getProperty('ALBUM_ID');
  var url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';

  var payload = {
    albumId: albumId,
    pageSize: 100,
  };

  var token = ScriptApp.getOAuthToken();

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());

  var mediaItems = json.mediaItems;

  var randomIndex = Math.floor(Math.random() * mediaItems.length);
  Logger.log(mediaItems.length);
  var randomMediaItem = mediaItems[randomIndex];

  var imageUrl = randomMediaItem.baseUrl;

  return imageUrl;
}

function textParams(text) {
  return {
    'type': 'text',
    'text': text
  };
}

function imageParams(url) {
  return {
    'type': 'image',
    'originalContentUrl': url,
    'previewImageUrl': url,
  };
}
