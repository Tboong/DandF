App = {
  web3Provider: null,
  contracts: {},
  
  // ******이거!
  init: function() { // 데이터 불러오고 html에 매물정보 보이도록 한다.
    $.getJSON('../real-estate.json', function(data) {
      var list = $('#list');
      var template = $('#template');

      for (i = 0; i < data.length; i++) {
        template.find('img').attr('src', data[i].picture); // src 속성에 picture 값을 갖게 한다.
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    })

    return App.initWeb3();
  },

  initWeb3: function() {
    // dapp에 web3 인스턴스가 이미 활성화되어있는지 체크

    if (typeof web3 !== 'undefined') { 
      // 브라우저에 메타마스크가 설치되어있다면
      // 주입된 web3 인스턴스가 존재하면
      // 메타마스크의 web3 인스턴스를 브라우저에 주입시키기 때문
      App.web3Provider = web3.currentProvider; // 공급자를 불러와
      web3 = new Web3(web3.currentProvider); // 그 공급자의 정보를 바탕으로 다시 우리 댑에서 쓸수있는 웹3 오브젝트를 만든다. 
    }
    else { // typeof web3 == 'undefined'
      // 브라우저에 메타마스크가 설치 x
      // 주입된 web3 인스턴스 존재하지 않는다면
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545'); // 로컬 공급자의 rpc 서버에 연결해서 공급자의 정보 가져오고 대입해라.
      web3 = new Web3(App.web3Provider); // 가나슈면 로컬호스트가 가나슈가 되는거야

    }

    return App.initContract();

    // 이제 dapp에서 이더리움 블록체인과 소통할 수 있게 되었다.
  },

  // 우리가 만든 스마트컨트랙을 인스턴스화시킨다.
  // 그래야 web3가 우리 컨트랙을 어디서 찾고 어떻게 작동하는지 알 수 있다.
  // 이 작업 편하게 하기 위해 truffle에서 라이브러리 제공 -> js 폴더의 truffle-contract.js
  initContract: function() {
		$.getJSON('RealEstate.json', function(data) {
      // 아티팩 파일은 abi 정보와 컨트랙 배포된 주소 가지고 있다. RealEstate.json
      // 아티팩 파일에 있는 데이터를 TruffleContract에서 제공하는 라이브러리 TruffleContract를 넘겨서 컨트랙을 인스턴스화 시킨다.
      App.contracts.RealEstate = TruffleContract(data); 
      // 컨트랙의 공급자 설정
      App.contracts.RealEstate.setProvider(App.web3Provider);

      App.listenToEvents(); // -> dapp에서 이벤트 계속 감지하도록! 이거 한번만 실행시키면 알아서 작동한다.
    });
  },

  buyRealEstate: function() {
    var id = $('#id').val();
    var name = $('#name').val();
    var price = $('#price').val();
    var age = $('#age').val();

    console.log(id);
    console.log(name);
    console.log(price);
    console.log(age);

    ethereum.enable().then(function (accounts){
      var account = accounts[0];
      App.contracts.RealEstate.deployed().then(function(instance){
        var nameUtf8Encoded = utf8.encode(name);
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from:account, value: price});
      }).then(function() {
        $('#name').val('');
        $('#age').val('');
        $('#buyModal').modal('hide');

        return App.loadRealEstates();
      });

    });


  },

  // 매입 후 매물 이미지 바꾸기
  loadRealEstates: function() {
    // getAllBuyers를 가져와 매입이 된 매물인지 확인하기
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getAllBuyers.call();
    }).then(function(buyers) {
      for (i = 0; i < buyers.length; i++) { // 10번 돌 것이다
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') { //빈주소를 뜻함 0 40개
          // 팔린 매물이면 이미지 교체
          
          // real-estate.json에서 "picture": "images/apartment.jpg", 여기서 images/ 뒤에 부분만 가져오는 작업임.
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7); // 이미지 이름만 가져온다
          
          switch(imgType) {
            case 'apartment.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg')
              break;
            case 'townhouse.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg')
              break;
            case 'house.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg')
              break;
          }

          // 해당 템플릿의 매입->매각 으로 바꾸고 버튼 비활성화
          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true);
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
          
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    })
  },
	
  listenToEvents: function() {
    App.contracts.RealEstate.deployed().then(function(instance) { // 컨트랙의 인스턴스 받아오고
      // 필터(모든 이벤트 감지하자 그래서 비워둠), 범위(0번블록부터 최근블록까지 로그 계속 감지하도록!).감지 & callback으로 error와 event를 받는다
      instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest' }).watch(function(error, event) { 
        if (!error) { // error가 없다면, event가 발살되면!
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + ' 번 매물을 매입했습니다.' + '</p>');
        }
        else {
          console.error(error);
        }
        App.loadRealEstates(); // 변경된 내용 페이지에 적용시키자
      })
    })
  }
};

// dapp이 실행되고 페이지가 로드되면 app 안에 init 함수 먼저 실행 ******
// html 다 로드되었을때 어떤걸 실행하라고 정의할 수 있는 공간
$(function() {
  $(window).load(function() {
    App.init();
  });

  // 모달이 띄워져 있으면
  // 부트스트랩 모달에 데이터 전달하는 방식!
  $('#buyModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");

    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);
  })

  $('#buyerInfoModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
  
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getBuyerInfo.call(id);
    }).then(function(buyInfo) {
      $(e.currentTarget).find('#buyerAddress').text(buyInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyInfo[1])); // 이름은 꼭 utf 변환
      $(e.currentTarget).find('#buyerAge').text(buyInfo[2]);
    }).catch(function(error) {
      console.log(err.message);
    })
  });
});