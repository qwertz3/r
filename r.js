
resolver.streamtape=function(url) {
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		const r=/ById\('.+?=\s*(["']\/\/[^;<]+)/g,
					s=[].find.call(doc.querySelectorAll("script:not(:empty)"),x=>r.test(x.textContent));
		if (s) {
			let m=s.textContent.match(r),
					u=m[m.length-1].match(new RegExp(r,''))[1].split("+").map(part=>{
						const m1=part.match(/["']([^'"]+)/),
									m2=part.match(/substring\(\d+/g);
						return m1?m1[1].substring(m2?m2.reduce((a,b)=>a+parseInt(b.substring(10)),0):0):"";
					}).join('');
			if (u.indexOf("//")===0) u='https:'+u;
			if (/^https?:\/\/./.test(u)) return u+"&stream=1";
				else throw new Error("Kein Video gefunden!");
		} else throw new Error("Skript nicht gefunden!");
	});
};
		
resolver.voe=function(url) {
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		const S=doc.querySelectorAll("script:not(:empty)");
		let s=[].find.call(S,x=>x.textContent.indexOf("const currentUrl")!==-1);
		if (s) {
			const m=s.textContent.match(/=\s*["'](http[^"']+)/);
			if (m && m[1]!==url) return resolver.voe(m[1]);
				else throw new Error("Keine URL in Weiterleitung!");
		} else {
			s=[].find.call(S,x=>/sources\s*=\s*{([\s\S]*?)}/.test(x.textContent));
			if (s) {
				const u=(x=>x?atob(x[1]):null)(s.textContent.match(/sources\s*=\s*{([\s\S]*?)}/i)[1].match(/hls["']?\s*:\s*["']([^"']+)/));
				//if (!u) u=(x=>x?x[1]:null)(s.textContent.match(/sources\s*=\s*{([\s\S]*?)}/i)[1].match(/["'](https?:\/\/.+?)["']/i));
				if (typeof u==='string' && /^https?:\/\/./.test(u)) return u;
					else throw new Error("Kein Video gefunden!");
			} else throw new Error("Source-Skript nicht gefunden!");
		}
	});
};

/* Funktioniert nicht wegen Referer
resolver.doodstream=function(url) {
	let tokenString="",
			host="";
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		
		console.log(doc.baseURI);
		
		const r=/dsplayer\.hotkeys[^']+'([^']+).+?function\s*makePlay.+?return[^?]+([^"]+)/,
					m=(x=>x?x.textContent.match(r):null)([].find.call(doc.querySelectorAll("script:not(:empty)"),x=>r.test(x.textContent)));
		host=doc.baseURI.match(/https?:\/\/([^\/]+)/); //2do: Wird baseURI ?berhaupt richtig gesetzt???
		if (m && host) {
			tokenString=m[2];
			return fetch(host[0]+m[1]);
		}else throw new Error("Skript nicht gefunden!");
	})
	.then(x=>x.text())
	.then(txt=>{
		if (txt && /^\s*https?:\/\/./.test(txt)) return {url:txt.indexOf("cloudflarestorage.")!==-1?txt.trim():txt+(Math.random()+1).toString(36).substring(2,12)+tokenString+Date.now(),referer:url,origin:host}; // 2do referer
			else throw new Error("Kein Video gefunden!");
	});
};
*/
								
resolver.vidoza=function(url) {
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		const v=doc.querySelector("video source");
		if (v && /^https?:\/\/./.test(v.src)) {
			return v.src;
		} else {
			const S=[].find.call(doc.querySelectorAll("script:not(:empty)"),s=>/window\.pData\s*=/i.test(s.textContent));
			if (S) {
				const u=S.textContent.match(/sourcesCode\s*:\s*\[{\s*src\s*:\s*['"](https?:\/\/[^"']+)/i);
				if (u && /^https?:\/\/./.test(u[1])) return u[1];
					else throw new Error("Kein Video gefunden!");
			} else throw new Error("Source-Skript nicht gefunden!");
		}
	});
};

resolver.filemoon=function(url) {
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		const packedScript=[].find.call(doc.querySelectorAll("script:not(:empty)"),x=>/p,a,c,k,e,d/i.test(x.textContent));
		if (packedScript && P_A_C_K_E_R.detect(packedScript.textContent)) {
			const unpackedScript=P_A_C_K_E_R.unpack(packedScript.textContent),
						u=unpackedScript.match(/sources:\s*\[\s*\{\s*file:\s*["'](.*?)["']/i);
			console.log(unpackedScript);
			if (u && /^https?:\/\/./.test(u[1])) return u[1];
				else throw new Error("Kein Video gefunden!");
		} else throw new Error("PACKED-Skript nicht gefunden!");		
	});
};

resolver.lulustream=function(url) {
	return fetch(url)
	.then(x=>x.document())
	.then(doc=>{
		const rg=/sources:\s*\[\s*\{\s*file:\s*["'](.*?)["']/i,
					s=[].find.call(doc.querySelectorAll("script:not(:empty)"),x=>rg.test(x.textContent));
		if (s) {
			const u=s.textContent.match(rg); 
			if (u && /^https?:\/\/./.test(u[1])) return u[1];
				else throw new Error("Kein Video gefunden!");
		} else throw new Error("Source-Skript nicht gefunden!");
	});	
};

resolver.s={
	_episodes:function(doc) {
		return [].map.call(doc.querySelectorAll(".seasonEpisodeTitle a"),(ep,i)=>{
			const de=ep.firstElementChild;
			return {
				name:de?de.textContent:"?",
				n:i+1,
				links:ep.href //2do
			};
		});		
	},
	list:function(url) {
		return fetch(url)
		.then(x=>x.document())
		.then(doc=>{
			
			console.log(doc.baseURI); //2do
			console.log(doc.head.baseURI);
			console.log(doc._url);
			console.log((b=>b?b.getAttribute("href"):"?")(doc.querySelector("base")));
			
			
			
			let list=[].map.call((x=>x && x.parentElement && x.parentElement.parentElement?x.parentElement.parentElement.querySelectorAll("a"):[])(doc.querySelector("#stream li a.active")),(sn,i)=>({
						name:"Staffel "+sn.textContent,
						active:sn.classList.contains("active"),
						episodes:sn.href // 2do
					})),
					x=list.find(z=>z.active);
			if (x) x.episodes=resolver.s._episodes(doc);
			return list;	
		});
	},
	episodes:function(url) {
		return fetch(url)
		.then(x=>x.document())
		.then(doc=>resolver.s._episodes(doc));
	},
	links:function(url) {
		return fetch(url)
		.then(x=>x.document())
		.then(doc=>{
			return [].map.call(doc.querySelectorAll(".watchEpisode"),strm=>{
				const hoster=strm.getElementsByTagName("h4");
				return {
					hoster:hoster?hoster[0].textContent:"?",
					url:strm.href // 2do
				};
			});			
		});
	}
};

resolver.S={
	_episodes:function(doc) {
		return [].map.call(doc.querySelectorAll(".seasonEpisodeTitle a"),(ep,i)=>{
			const de=ep.firstElementChild,
						en=ep.lastElementChild,
						m=en?en.textContent.match(/\d+/):null;
			return {
				name:de?de.textContent:"?",
				n:m?parseInt(m[0]):i+1,
				links:ep.href //2do
			};
		});		
	},
	list:function(url) {
		return fetch(url)
		.then(x=>x.document())
		.then(doc=>{
			const y=parseInt((doc.querySelector('[itemprop="startDate"] a')||{}).textContent||0)||0;
						// eigentlich y=(parseInt((doc.querySelector('[itemprop="startDate"] a')||{}).textContent||1)||1)-1;
			let list=[].map.call((x=>x && x.parentElement && x.parentElement.parentElement?x.parentElement.parentElement.querySelectorAll("a"):[])(doc.querySelector("#stream li a.active")),(sn,i)=>({
						name:y>0?((parseInt(sn.textContent)||i+1)+y).toString():"Staffel "+sn.textContent,
						active:sn.classList.contains("active"),
						episodes:sn.href // 2do
					})),
					x=list.find(z=>z.active);
			if (x) x.episodes=resolver.S._episodes(doc);
			return list.reverse();
		});
	},
	episodes:function(url) {
		return fetch(url)
		.then(x=>x.document())
		.then(doc=>resolver.S._episodes(doc));
	},
	links:function(url) { return resolver.s.links(url); }
};


var P_A_C_K_E_R = {
    detect: function(str) {
        return (P_A_C_K_E_R.get_chunks(str).length > 0);
    },

    get_chunks: function(str) {
        var chunks = str.match(/eval\(\(?function\(.*?(,0,\{\}\)\)|split\('\|'\)\)\))($|\n)/g);
        return chunks ? chunks : [];
    },

    unpack: function(str) {
        var chunks = P_A_C_K_E_R.get_chunks(str),
            chunk;
        for (var i = 0; i < chunks.length; i++) {
            chunk = chunks[i].replace(/\n$/, '');
            str = str.split(chunk).join(P_A_C_K_E_R.unpack_chunk(chunk));
        }
        return str;
    },

    unpack_chunk: function(str) {
        var unpacked_source = '';
        var __eval = eval;
        if (P_A_C_K_E_R.detect(str)) {
            try {
                eval = function(s) { // jshint ignore:line
                    unpacked_source += s;
                    return unpacked_source;
                }; // jshint ignore:line
                __eval(str);
                if (typeof unpacked_source === 'string' && unpacked_source) {
                    str = unpacked_source;
                }
            } catch (e) {
                // well, it failed. we'll just return the original, instead of crashing on user.
            }
        }
        eval = __eval; // jshint ignore:line
        return str;
    }
}

function unpack(c) {
	const depack=function(p) {
		if(p != "") {
			c = unescape(p);
			var _e = eval,
				s = "eval=function(v){c=v;};" + c +
				";eval=_e;";
			eval(s)
		}
		else {
			c = p
		};
		return c
	};
	var a = 5,	x = 1;
	while(x < a) {
		c = unescape(c);
		if(/eval\(+function\(/.test(c)) {
			c = depack(c);
			x++
		}
		else {
			break
		}
	};
	return unescape(c);
}
