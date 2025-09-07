def read_link(url: str) -> str:
    """使用 urllib 读取 URL 内容并提取纯文本"""
    from html.parser import HTMLParser
    from urllib.error import URLError
    from urllib.request import urlopen

    class HTMLTextExtractor(HTMLParser):
        def __init__(self):
            super().__init__()
            self.text = []
            self.ignore_tags = {'script', 'style', 'head', 'meta'}
            self.current_ignore_tag = None

        def handle_starttag(self, tag, attrs):
            if tag in self.ignore_tags:
                self.current_ignore_tag = tag

        def handle_endtag(self, tag):
            if tag == self.current_ignore_tag:
                self.current_ignore_tag = None
            # 添加换行使内容更可读
            if tag in ('p', 'br', 'div', 'section', 'article'):
                self.text.append('\n')

        def handle_data(self, data):
            if not self.current_ignore_tag:
                stripped = data.strip()
                if stripped:
                    self.text.append(stripped)

    try:
        print(f"Reading URL content: {url}")
        with urlopen(url) as response:
            content = response.read().decode('utf-8')

            # 解析HTML并提取纯文本
            parser = HTMLTextExtractor()
            parser.feed(content)
            plain_text = ' '.join(parser.text)

            return plain_text[:10000]  # 限制返回内容长度
    except URLError as e:
        return f"Error reading URL: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
