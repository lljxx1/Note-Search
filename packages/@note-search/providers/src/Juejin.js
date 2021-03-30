export default class JuejinAdapter {
  constructor(ac) {
    this.version = '0.0.2'
    this.name = 'juejin'

		// modify origin headers
    modifyRequestHeaders('api.juejin.cn', {
    	Origin: 'https://juejin.cn',
      Referer: 'https://juejin.cn/'
    }, [
    	'*://api.juejin.cn/*',
    ])
  }

  async getMetaData() {
    var data = await $.get('https://api.juejin.cn/user_api/v1/user/get')
    console.log(data)
    return {
      uid: data.data.user_id,
      title: data.data.user_name,
      avatar: data.data.avatar_large,
      type: 'juejin',
      displayName: '掘金',
      raw: data.data,
      supportTypes: ['markdown', 'html'],
      home: 'https://juejin.cn/editor/drafts',
      icon: 'https://gold-cdn.xitu.io/favicons/favicon.ico',
    }
  }

  async addPost(post, _instance) {
    return {
      status: 'success',
      post_id: 0,
    }
  }

  async editPost(post_id, post) {
    console.log('TurndownService', turndown)
    var turndownService = new turndown()
    turndownService.addRule('codefor', {
      filter: ['pre'],
      replacement: function (content) {
        return ['```', content, '```'].join('\n')
      },
    })

    var markdown = turndownService.turndown(post.post_content)
    console.log(markdown);
    const { data } = await axios.post('https://api.juejin.cn/content_api/v1/article_draft/create', {
        brief_content: '',
      	category_id: '0',
        cover_image: '',
      	edit_type: 10,
      	html_content: "deprecated",
      	link_url: "",
      	mark_content: markdown,
      	tag_ids: [],
      	title: post.post_title
    })
    var post_id = data.data.id
    console.log(data)
    return {
      status: 'success',
      post_id: post_id,
      draftLink: 'https://juejin.cn/editor/drafts/' + post_id,
    }
  }

  async uploadFile(file) {
    var src = file.src
    var imageId = Date.now() + Math.floor(Math.random() * 1000)
    const { data } = await axios.post('https://juejin.cn/image/urlSave', {
    	url: src
    })
    return [
      {
        id: imageId,
        object_key: imageId,
        url: data.data,
      },
    ]
  }

  async preEditPost(post) {
    var div = $('<div>')
    $('body').append(div)
    try {
      console.log('zihu.Juejin')
      div.html(post.content)
      var doc = div
      tools.processDocCode(div)
      tools.makeImgVisible(div)

      var tempDoc = $('<div>').append(doc.clone())
      post.content =
        tempDoc.children('div').length == 1
          ? tempDoc.children('div').html()
          : tempDoc.html()

      console.log('after.predEdit', post.content)
    } catch (e) {
      console.log('preEdit.error', e)
    }
  }
}
