(function(app) {
  app.AppComponent =
    ng.core.Component({
      selector: 'dialer-app',
      template: `
  <div id="dialer">
    <!-- Dialer input -->
    <div class="input-group input-group-sm">
      <!-- Create a country code dropdown -->
      <div class="input-group-btn">
        <button type="button" class="btn btn-default dropdown-toggle" 
          data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            +<span class="country-code">{{ selectedCountryCode }}</span>
            <i class="fa fa-caret-down"></i>
        </button>

        <ul class="dropdown-menu">
          <li *ngFor="let country of countries">
            <a href="#" (click)="selectCountry(country)">
              <div class="flag flag-{{country.code}}"></div>
              <span>{{country.name}} (+{{country.cc}})</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- DTMF Tone interface -->
      <div class="keys" *ngIf="onPhone">
        <div class="key-row">
          <button class="btn btn-circle btn-default" (click)="sendDigit('1')">1</button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('2')">2
            <span>A B C</span>
          </button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('3')">3
            <span>D E F</span>
          </button>
        </div>
        <div class="key-row">
          <button class="btn btn-circle btn-default" (click)="sendDigit('4')">4
            <span>G H I</span>
          </button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('5')">5
            <span>J K L</span>
          </button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('6')">6
            <span>M N O</span>
          </button>
        </div>
        <div class="key-row">
          <button class="btn btn-circle btn-default" (click)="sendDigit('7')">7
            <span>P Q R S</span>
          </button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('8')">8
            <span>T U V</span>
          </button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('9')">9
            <span>W X Y Z</span>
          </button>
        </div>
        <div class="key-row">
          <button class="btn btn-circle btn-default" (click)="sendDigit('*')">*</button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('0')">0</button>
          <button class="btn btn-circle btn-default" (click)="sendDigit('#')">#</button>
        </div>
      </div>

      <!-- Telephone input field -->
      <input type="tel" class="form-control" placeholder="555-666-7777"
          (keyup)="onNumberKeyUp($event)">
    </div>

    <!-- Audio Controls -->
    <div class="controls">
      <button class="btn btn-circle" 
          [ngClass]="{'btn-danger': onPhone, 'btn-success': !onPhone}"
          (click)="toggleCall()" [disabled]="!isValidNumber">
        <i class="fa fa-fw"
            [ngClass]="{'fa-close': onPhone, 'fa-phone': !onPhone}"></i>
      </button>
      <button class="btn btn-circle btn-default"
          *ngIf="onPhone" (click)="toggleMute()">
        <i class="fa fa-fw"
            [ngClass]="{'fa-microphone-slash': muted, 'fa-microphone': !muted}"></i>
      </button>
    </div>

    <!-- Status logging -->
    <div class="log">{{ logtext }}</div>
    <p>{{ identity }}</p>

  </div>`
    })
    .Class({
      constructor: function() {
        this.onPhone = false;
        this.muted = false;
        this.currentNumber = '';
        this.isValidNumber = false;
        this.selectedCountryCode = '1';
        this.countries = [
          { name: 'United States', cc: '1', code: 'us' },
          { name: 'Great Britain', cc: '44', code: 'gb' },
          { name: 'Colombia', cc: '57', code: 'co' },
          { name: 'Ecuador', cc: '593', code: 'ec' },
          { name: 'Estonia', cc: '372', code: 'ee' },
          { name: 'Germany', cc: '49', code: 'de' },
          { name: 'Hong Kong', cc: '852', code: 'hk' },
          { name: 'Ireland', cc: '353', code: 'ie' },
          { name: 'Singapore', cc: '65', code: 'sg' },
          { name: 'Spain', cc: '34', code: 'es' },
          { name: 'Brazil', cc: '55', code: 'br' },
        ];

        var self = this;

        // Fetch Twilio capability token from our Node.js server
        $.getJSON('/token').done(function(data) {
          self.identity = data.identity;
          Twilio.Device.setup(data.token);
          self.logtext = `Connected with generated client name "${self.identity}"`;
          console.log(self.logtext);
        }).fail(function(err) {
          console.log(err);
          self.logtext = 'Could not fetch token, see console.log';
        });

        // Configure event handlers for Twilio Device
        Twilio.Device.disconnect(function() {
          self.onPhone = false;
          self.logtext = 'Call ended.';
        });

      },

      // Handle numeric buttons
      sendDigit: function(digit) {
        Twilio.Device.activeConnection().sendDigits(digit);
      },

      // Handle number key up event
      onNumberKeyUp: function(event) {
        this.currentNumber = event.target.value;
        this.isValidNumber = /^([0-9]|#|\*)+$/.test(this.currentNumber.replace(/[-()\s]/g,''));
      },

      // Handle country code selection
      selectCountry: function(country) {
        this.selectedCountryCode = country.cc;
      },
      
      // Make an outbound call with the current number,
      // or hang up the current call
      toggleCall: function() {
        if (!this.onPhone) {
          this.onPhone = true;
          this.muted = false;

          // make outbound call with current number
          console.log(this.currentNumber);
          var n = '+' + this.selectedCountryCode + this.currentNumber.replace(/\D/g, '');
          Twilio.Device.connect({ number: n });
          this.logtext = 'Calling ' + n;
        } else {
          // hang up call in progress
          Twilio.Device.disconnectAll();
        }

      },

      // Handle muting
      toggleMute: function() {
        var muted = muted;
        this.muted = !muted;

        Twilio.Device.activeConnection().mute(!muted);
      },
    });
})(window.app || (window.app = {}));