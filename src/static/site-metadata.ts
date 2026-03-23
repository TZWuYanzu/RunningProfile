interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const data: ISiteMetadataResult = {
  siteTitle: '诺金的跑野记录',
  siteUrl: 'https://TZWuYanzu.github.io/RunningProfile',
  logo: 'https://avatars.githubusercontent.com/TZWuYanzu',
  description: 'Personal running page',
  navLinks: [
    {
      name: 'Blog',
      url: '', // blog链接
    },
    {
      name: 'About',
      url: '', // todo
    },
  ],
};

export default data;
