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
  siteTitle: 'Running Page',
  siteUrl: '', // https://zhuyoukang/running/profile.com
  logo: 'https://avatars.githubusercontent.com/u/8546109?v=4', // todo
  description: 'Personal site and blog',
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
