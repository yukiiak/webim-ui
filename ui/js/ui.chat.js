//
/* ui.chat:
 *
 options:
 window
 history

 methods:
 update(info)
 status(type)
 insert(text, isCursorPos)
 focus
 notice(text, timeOut)
 destroy()

 events: 
 sendMsg
 sendStatus

 */
 
function ieCacheSelection(e){
        document.selection && (this.caretPos = document.selection.createRange());
}
widget("chat",{
        template:'<div class="webim-chat"> \
                                                <div id=":header" class="webim-chat-header ui-widget-subheader">  \
                                                        <div id=":user" class="webim-user"> \
                                                                <a id=":userPic" class="webim-user-pic" href="#id"><img src="about:blank"></a> \
                                                                <span id=":userStatus" title="" class="webim-user-status">Hello</span> \
                                                        </div> \
                                                </div> \
                                                                                                                                        <div class="webim-chat-notice-wrap"><div id=":notice" class="webim-chat-notice ui-state-highlight"></div></div> \
                                                <div id=":content" class="webim-chat-content"> \
                                                                                                                <div id=":status" class="webim-chat-status webim-gray"></div> \
                                                </div> \
                                                <div id=":actions" class="webim-chat-actions"> \
                                                        <div id=":toolContent" class="webim-chat-tool-content"></div>\
                                                        <div id=":tools" class="webim-chat-tools ui-helper-clearfix ui-state-default"></div>\
                                                        <table class="webim-chat-t" cellSpacing="0"> \
                                                                <tr> \
                                                                        <td style="vertical-align:top;"> \
                                                                        <em class="webim-icon webim-icon-chat"></em>\
                                                                        </td> \
                                                                        <td style="vertical-align:top;width:100%;"> \
                                                                        <div class="webim-chat-input-wrap">\
                                                                                <textarea id=":input" class="webim-chat-input webim-gray"><%=input notice%></textarea> \
                                                                        </div> \
                                                                        </td> \
                                                                </tr> \
                                                        </table> \
                                                </div> \
                                        </div>'
},{
	_init: function(){
		var self = this, element = self.element, options = self.options, win = self.window = options.window;
		var history = self.history = new webimUI.history(null,{
			userInfo: options.userInfo,
			buddyInfo: options.buddyInfo
		});
		self.$.content.insertBefore(history.element, self.$.content.firstChild);
		//self._initEvents();
		if(win){
			win.html(element);
			self._bindWindow();
			//self._fitUI();
		}
		self.update(options.buddyInfo);
		history.add(options.history);
		plugin.call(self, "init", [null, self.plugin_ui()]);
		self._adjustContent();
	},
	update: function(buddyInfo){
		var self = this;
		if(buddyInfo){
			self.option("buddyInfo", buddyInfo);
			self.history.option("buddyInfo", buddyInfo);
			self._updateInfo(buddyInfo);
		}
		var userOn = self.options.userInfo.presence == "online";
		var buddyOn = self.options.buddyInfo.presence == "online";
		if(!userOn){
			self.notice(i18n("user offline notice"));
		}else if(!buddyOn){
			self.notice(i18n("buddy offline notice",{name: buddyInfo.name}));
		}else{
			self.notice("");
		}
	},
	focus: function(){
		this.$.input.focus();
	},
	_noticeTime: null,
	_noticeTxt:"",
	notice: function(text, timeOut){
		var self = this, content = self.$.notice, time = self._noticeTime;
		if(time)clearTimeout(time);
		if(!text){
			self._noticeTxt = null;
			hide(content);
			return;
		}
		if(timeOut){
			content.innerHTML = text;
			show(content);
			setTimeout(function(){
				if(self._noticeTxt)
					content.innerHTML = self._noticeTxt;
				else hide(content, 500);
			}, timeOut);

		}else{
			self._noticeTxt = text;
			content.innerHTML = text;
			show(content);
		}
	},
	_adjustContent: function(){
		var content = this.$.content;
		content.scrollTop = content.scrollHeight;
	},
	_fitUI: function(e){
		var self = this, win = self.window, $ = self.$;
		self._adjustContent();

	},
	_bindWindow: function(){
		var self = this, win = self.window;
		win.bind("displayStateChange", function(type){
			if(type != "minimize"){
				self.$.input.focus();
				self._adjustContent();
			}
		});
		//win.bind("resize",{self: self}, self._fitUI);
	},
	_inputAutoHeight:function(){
		var el = this.$.input, scrollTop = el[0].scrollTop;
		if(scrollTop > 0){
			var h = el.height();
			if(h> 32 && h < 100) el.height(h + scrollTop);
		}
	},
	_sendMsg: function(val){
		var self = this, options = self.options, buddyInfo = options.buddyInfo;
		var msg = {
			type: "msg",
			to: buddyInfo.id,
			from: options.userInfo.id,
			stype: '',
			offline: buddyInfo.presence == "online" ? 0 : 1,
			body: val,
			timestamp: (new Date()).getTime()
		};
		plugin.call(self, "send", [null, self.plugin_ui({msg: msg})]);
		self.trigger('sendMsg', msg);
		//self.sendStatus("");
	},
	_inputkeypress: function(e){
		var self =  this, $ = self.$;
		if (e.keyCode == 13){
			if(e.ctrlKey){
				self.insert("\n", true);
				return true;
			}else{
				var el = target(e), val = el.value;
				if (trim(val)) {
					self._sendMsg(val);
					el.value = "";
					preventDefault(e);
				}
			}
		}
		else self._typing();

	},
	_onFocusInput: function(e){
		var self = this, el = target(e);

		//var val = el.setSelectionRange ? el.value.substring(el.selectionStart, el.selectionEnd) : (window.getSelection ? window.getSelection().toString() : (document.selection ? document.selection.createRange().text : ""));
		var val = window.getSelection ? window.getSelection().toString() : (document.selection ? document.selection.createRange().text : "");
		if(!val)self.$.input.focus();
	},
	_initEvents: function(){
		var self = this, options = self.options, $ = self.$, placeholder = i18n("input notice"), gray = "webim-gray", input = $.input;

		self.history.bind("update", function(){
			self._adjustContent();
		}).bind("clear", function(){
			self.notice(i18n("clear history notice"), 3000);
		});
		//输入法中，进入输入法模式时keydown,keypress触发，离开输入法模式时keyup事件发生。
		//autocomplete之类事件放入keyup，回车发送事件放入keydown,keypress

		addEvent(input,'keyup',function(){
			ieCacheSelection.call(this);
		});
		addEvent(input,"click", ieCacheSelection);
		addEvent(input,"select", ieCacheSelection);
		addEvent(input,'focus',function(){
			removeClass(this, gray);
			if(this.value == placeholder)this.value = "";
		});
		addEvent(input,'blur',function(){
			if(this.value == ""){
				addClass(this, gray);
				this.value = placeholder;
			}
		});
		addEvent(input,'keypress',function(e){
			self._inputkeypress(e);
		});
		addEvent($.content, "click", function(e){self._onFocusInput(e)});

	},
	_updateInfo:function(info){
		var self = this, $ = self.$;
		$.userPic.setAttribute("href", info.url);
		$.userPic.firstChild.setAttribute("src", info.pic_url);
		$.userStatus.innerHTML = info.status;
		self.window.title(info.name);
	},
	insert:function(value, isCursorPos){
		//http://hi.baidu.com/beileyhu/blog/item/efe29910f31fd505203f2e53.html
		var self = this,input = self.$.input;
		input.focus();
		if(!isCursorPos){
			input.value = value;
			return;
		}
		if(!value) value = "";
		if(input.setSelectionRange){
			var val = input.value, rangeStart = input.selectionStart, rangeEnd = input.selectionEnd, tempStr1 = val.substring(0,rangeStart), tempStr2 = val.substring(rangeEnd), len = value.length;  
			input.value = tempStr1+value+tempStr2;  
			input.setSelectionRange(rangeStart+len,rangeStart+len);
		}else if(document.selection){
			var caretPos = input.caretPos;
			if(caretPos){
				caretPos.text = value;
				caretPos.collapse();
				caretPos.select();
			}
			else{
				input.value += value;
			}
		}else{
			input.value += value;
		}
	},
	_statusText: '',
	sendStatus: function(show){
		var self = this;
		if (!show || show == self._statusText) return;
		self._statusText = show;
		self.trigger('sendStatus', {
			to: self.options.buddyInfo.id,
			show: show
		});
	},
	_checkST: false,
	_typing: function(){
		var self = this;
		self.sendStatus("typing");
		if (self._checkST) 
			clearTimeout(self._checkST);
		self._checkST = window.setTimeout(function(){
			self.sendStatus('clear');
		}, 6000);
	},
	_setST: null,
	status: function(type){
		//type ['typing']
		type = type || 'clear';
		var self = this, el = self.$.status, name = self.options.buddyInfo.name, markup = '';
		markup = type == 'clear' ? '' : name + i18n(type);
		el.innerHTML = markup;
		self._adjustContent();
		if (self._setST)  clearTimeout(self._setST);
		if (markup != '') 
			self._setST = window.setTimeout(function(){
				el.innerHTML = '';
			}, 10000);
	},
	destroy: function(){
		this.window.close();
	},
	plugin_ui:function(ext){
		var self = this;
		return extend({
			self: self,
			$: self.$,
			history: self.history
		}, ext);
	},
	plugins: {}
});

webimUI.chat.defaults.emot = true;
plugin.add("chat","emot",{
	init:function(e, ui){
		var chat = ui.self;
		var emot = new webimUI.emot();
		emot.bind("select",function(alt){
			chat.focus();
			chat.insert(alt, true);
		});
		var trigger = createElement(tpl('<a href="#chat-emot" title="<%=emot%>"><em class="webim-icon webim-icon-emot"></em></a>'));
		addEvent(trigger,"click",function(e){
			preventDefault(e);
			emot.toggle();
		});
		ui.$.toolContent.appendChild(emot.element);
		ui.$.tools.appendChild(trigger);
	},
	send:function(e, ui){
	}
});
webimUI.chat.defaults.clearHistory = true;
plugin.add("chat","clearHistory",{
	init:function(e, ui){
		var chat = ui.self;
		var trigger = createElement(tpl('<a href="#chat-clearHistory" title="<%=clear history%>"><em class="webim-icon webim-icon-clear"></em></a>'));
		addEvent(trigger,"click",function(e){
			preventDefault(e);
			chat.trigger("clearHistory",[chat.options.buddyInfo]);
		});
		ui.$.tools.appendChild(trigger);
	}
});