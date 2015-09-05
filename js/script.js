$( function() {
  var n_months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  window.App = {
    Models      : {},
    Views       : {},
    Collections : {}
  };
  App.template = function( id ) {
    return _.template( $( '#' + id ).html() );
  };
  App.Views.Calendar = Backbone.View.extend( {
    el         : $( "#calendar" ),
    initialize : function( attr ) {
      console.log( this.collection.toJSON() );
      attr = attr || {};

      this.currentYear = attr[ "year" ] || new Date().getFullYear();
      this.currentMonth = attr[ "month" ] || new Date().getMonth();
      this.update();

      //vent.on('contact:edit', this.editContact, this);
    },
    events     : {
      "click .calendar-prev" : "prev",
      "click .calendar-next" : "next",
      "click .calendar-day"  : "showInfo"
    },
    render     : function() {
      var calendar = "<tr>";
      var i = 0;
      var month = this.currentDay.getMonth() + 1;
      if ( this.DNfirst != 0 ) {
        for ( i = 1; i < this.DNfirst; i++ ) {
          calendar += '<td></td>';
        }
      } else {
        for ( i = 0; i < 6; i++ ) {
          calendar += '<td></td>';
        }
      }
      for ( i = 1; i <= this.dayLast; i++ ) {
        var inCollection = App.notes.get( this.currentDay.getFullYear() + "" + ((month < 10 ? "0" : "") + month) + "" + ((i < 10 ? "0" : "") + i) );
        if ( i == new Date().getDate() && this.currentDay.getFullYear() == new Date().getFullYear() && this.currentDay.getMonth() == new Date().getMonth() ) {
          calendar += '<td class="calendar-day warning ' + (inCollection ? "tasked" : "") + '" data-day="' + i + '">' + i + "</td>";
        } else {
          calendar += '<td class="calendar-day ' + (inCollection ? "tasked" : "") + '" data-day="' + i + '">' + i + "</td>";
        }
        if ( new Date( this.currentDay.getFullYear(), this.currentDay.getMonth(), i ).getDay() == 0 ) {
          calendar += '<tr>';
        }
      }
      for ( i = this.DNlast; i < 7; i++ ) {
        calendar += '<td></td>';
      }
      this.$el.find( 'tbody' ).html( calendar );
      this.$el.find( '.calendar-title' ).html( n_months[ this.currentDay.getMonth() ] + ' ' + this.currentDay.getFullYear() );
      if ( this.$el.find( 'tbody tr' ).length < 6 ) {  // чтобы при перелистывании месяцев не "подпрыгивала" вся страница, добавляется ряд пустых клеток. Итог: всегда 6 строк для цифр
        this.$el.find( 'tbody' )[ 0 ].innerHTML += '<tr><td>&nbsp;<td>&nbsp;<td>&nbsp;<td>&nbsp;<td>&nbsp;<td>&nbsp;<td>&nbsp;';
      }

      return this
    },
    prev       : function() {
      this.currentMonth--;
      this.update();
    },
    next       : function() {
      this.currentMonth++;
      this.update();
    },
    update     : function() {
      this.dayLast = new Date( this.currentYear, this.currentMonth + 1, 0 ).getDate();
      this.currentDay = new Date( this.currentYear, this.currentMonth, this.dayLast );
      this.DNlast = new Date( this.currentYear, this.currentMonth, this.dayLast ).getDay();
      this.DNfirst = new Date( this.currentYear, this.currentMonth, 1 ).getDay();
      return this.render()
    },
    showInfo   : function( event ) {
      var id = this.currentYear + "" + (((this.currentMonth + 1) < 10 ? "0" : "") + (this.currentMonth + 1) + "" + ((event.currentTarget.dataset.day < 10 ? "0" : "") + event.currentTarget.dataset.day))
      var model = App.notes.get( id );
      if ( model ) {
        var editNoteView = new App.Views.EditNote( { model : model } );
      } else {
        var addNoteView = new App.Views.AddNote( {
          date : new Date( this.currentYear, this.currentMonth, event.currentTarget.dataset.day )
        } );
      }

    }
  } );
  App.Models.Note = Backbone.Model.extend( {
    initialize : function() {
      var noteView = new App.Views.Note( {
        model : this
      } )
    },
    validate   : function( attrs ) {
      if ( !attrs.message ) {
        return "Необходио указать текст заметки"
      }
    }
  } );
  App.Views.Note = Backbone.View.extend( {
    initialize : function() {
      this.model.on( "delete", this.unrender, this );
      this.render()
    },
    render     : function() {
      this.$el = $( "#calendar-wrapper" ).find( '[data-day=' + this.model.get( "d" ).getDate() + ']' );
      this.$el.addClass( "tasked" );
      return this
    },
    unrender   : function() {
      this.$el = $( "#calendar-wrapper" ).find( '[data-day=' + this.model.get( "d" ).getDate() + ']' );
      this.$el.removeClass( "tasked" );
    }
  } );

  App.Collections.Notes = Backbone.Collection.extend( {
    model : App.Models.Note
  } );

  App.Views.AddNote = Backbone.View.extend( {
    template   : App.template( "note-add" ),
    events     : {
      "click .calendar-note-add"    : "addNote",
      "click .calendar-note-cancel" : "unrender"
    },
    initialize : function( attr ) {
      this.currentDate = attr.date;
      var day = this.currentDate.getDate();
      var month = this.currentDate.getMonth() + 1;
      var year = this.currentDate.getFullYear();
      this.currentDateName = year + "-" + ((month < 10 ? "0" : "") + month) + "-" + ((day < 10 ? "0" : "") + day);
      this.render()
    },
    addNote    : function() {
      var model = new App.Models.Note( {
        d       : this.currentDate,
        id      : this.currentDateName.split( "-" ).join( "" ),
        date    : this.currentDateName,
        message : this.$el.find( ".note-message" ).val()
      } );
      if ( !model.isValid() ) {
        alert( model.get( "message" ) + " " + model.validationError );
        model.trigger( "delete" );
        return
      }
      App.notes.add( model );
      this.unrender();
    },
    unrender   : function() {
      var self = this;
      this.$el.fadeOut( function() {
        self.remove();
      } );
    },
    render     : function() {
      var tpl = $( this.template( {
        date : this.currentDateName
      } ) ).hide();
      $( "#calendar-wrapper" ).append( tpl );
      tpl.fadeIn();
      this.$el = $( "#note-message-add" );
      return this
    }
  } );
  App.Views.EditNote = Backbone.View.extend( {
    template   : App.template( "note-info" ),
    events     : {
      "click .calendar-note-save"   : "saveNote",
      "click .calendar-note-delete" : "deleteNote",
      "click .calendar-note-cancel" : "unrender"
    },
    initialize : function() {
      this.render()
    },
    saveNote   : function() {
      var message = this.$el.find( ".note-message" ).val();
      if ( !message ) {
        alert( message + " Необходио указать текст заметки" );
        return
      }
      this.model.set( "message", message );
      this.unrender();
    },
    deleteNote : function() {
      this.model.trigger( "delete" );
      App.notes.remove( this.model );
      this.unrender();
    },
    unrender   : function() {
      var self = this;
      this.$el.fadeOut( function() {
        self.remove();
      } );
    },
    render     : function() {
      var tpl = $( this.template( this.model.toJSON() ) ).hide();
      $( "#calendar-wrapper" ).append( tpl );
      tpl.fadeIn();
      this.$el = $( "#note-message-info" );
      return this
    }
  } );

  App.notes = new App.Collections.Notes;
  new App.Views.Calendar( {
    collection : App.notes
  } );

} );
