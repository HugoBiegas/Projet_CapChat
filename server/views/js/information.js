function getData(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        callback(response);
      }
    };
    xhr.send();
  }

  function addThemeRow(theme) {
    const table = document.getElementById('themeTable').getElementsByTagName('tbody')[0];
    const row = table.insertRow();

    const nameCell = row.insertCell();
    nameCell.textContent = theme.nomTheme;

    const countCell = row.insertCell();
    countCell.textContent = theme.nombreImages;

    const urlCell = row.insertCell();
    urlCell.textContent = theme.urlUsageTheme;

    const buttonCell = row.insertCell();
    const addButton = document.createElement('button');
    addButton.textContent = 'Ajouter';
    addButton.onclick = function() {
      addToURL(theme.urlUsageTheme);
    };
    buttonCell.appendChild(addButton);
  }

  function addCapChatRow(capChat) {
    const table = document.getElementById('capChatTable').getElementsByTagName('tbody')[0];
    const row = table.insertRow();

    const nameCell = row.insertCell();
    nameCell.textContent = capChat.nomCapChat;

    const countCell = row.insertCell();
    countCell.textContent = capChat.nombreImages;

    const urlCell = row.insertCell();
    urlCell.textContent = capChat.urlUsage;

    const buttonCell = row.insertCell();
    const testButton = document.createElement('button');
    testButton.textContent = 'Tester';
    testButton.onclick = function() {
      testCapChat(capChat.urlUsage);
    };
    buttonCell.appendChild(testButton);
  }

  function addToURL(url) {
    const currentURL = window.location.href;
    const newURL = currentURL + '/capchatTheme/' + url;
    window.location.href = newURL;
  }

  function testCapChat(url) {
    const currentURL = window.location.href;
    const newURL = currentURL + '/capchat/' + url;
    window.location.href = newURL;
  }

  getData('/api/capChatThemes', function(themes) {
    themes.forEach(function(theme) {
      addThemeRow(theme);
    });
  });

  getData('/api/allcapChat', function(capChats) {
    capChats.forEach(function(capChat) {
      addCapChatRow(capChat);
    });
  });
